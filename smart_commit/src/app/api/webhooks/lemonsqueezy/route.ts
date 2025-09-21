import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Security validation functions
async function validateSubscriptionOwnership(subscriptionId: string, userId: string): Promise<boolean> {
  try {
    // Check if this user actually owns this subscription
    const { data, error } = await supabase
      .from('user_subscriptions')
      .select('user_id')
      .eq('lemon_squeezy_id', subscriptionId)
      .single();

    if (error || !data) {
      console.error('Subscription not found:', subscriptionId);
      return false;
    }

    return data.user_id === userId;
  } catch (error) {
    console.error('Ownership validation failed:', error);
    return false;
  }
}

function validateWebhookData(subscription: any, userId: string): boolean {
  if (!subscription?.id || !subscription?.attributes) {
    console.error('Invalid subscription data structure');
    return false;
  }

  if (!userId || typeof userId !== 'string') {
    console.error('Invalid or missing user_id');
    return false;
  }

  // Validate subscription ID format (Lemon Squeezy uses numeric IDs)
  if (!/^\d+$/.test(subscription.id)) {
    console.error('Invalid subscription ID format:', subscription.id);
    return false;
  }

  return true;
}

// Helper function to get plan details
async function getPlanDetails(planId: string) {
  const { data: plan, error } = await supabase
    .from('subscription_plans')
    .select('requests_limit')
    .eq('id', planId)
    .single();

  if (error || !plan) {
    console.error('Failed to get plan details:', planId);
    // Return default values if plan not found
    return { requests_limit: planId === 'pro' ? 200 : 500 };
  }

  return plan;
}

// Helper function to calculate next reset date
function getNextResetDate(): string {
  const now = new Date();
  const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  return nextMonth.toISOString().split('T')[0]; // Return date only
}

export async function POST(request: NextRequest) {
  try {
    // Basic rate limiting check
    const clientIP = request.headers.get('x-forwarded-for') ||
                     request.headers.get('x-real-ip') ||
                     'unknown';

    // Check if this IP has made too many requests recently
    const { data: recentRequests } = await supabase
      .from('webhook_events')
      .select('created_at')
      .gte('created_at', new Date(Date.now() - 60000).toISOString()) // Last minute
      .limit(10);

    if (recentRequests && recentRequests.length > 5) {
      console.warn('Rate limit exceeded for IP:', clientIP);
      return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });
    }

    const body = await request.text();
    const signature = request.headers.get("x-signature");

    // Verify webhook signature
    const hash = crypto
      .createHmac("sha256", process.env.LEMON_SQUEEZY_WEBHOOK_SECRET!)
      .update(body)
      .digest("hex");

    if (signature !== hash) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    const event = JSON.parse(body);
    const eventType = event.meta.event_name;
    const subscription = event.data;

    // Duplicate event protection
    const eventId = event.meta.webhook_id;

    // Check if we've already processed this event
    const { data: existingEvent } = await supabase
      .from('webhook_events')
      .select('id')
      .eq('webhook_id', eventId)
      .single();

    if (existingEvent) {
      return NextResponse.json({ message: "Event already processed" });
    }

    switch (eventType) {
      case "subscription_created":
        await handleSubscriptionCreated(subscription, event.meta);
        break;
      case "subscription_updated":
        await handleSubscriptionUpdated(subscription);
        break;
      case "subscription_cancelled":
        await handleSubscriptionCancelled(subscription);
        break;
      case "subscription_resumed":
        await handleSubscriptionResumed(subscription);
        break;
      case "subscription_expired":
        await handleSubscriptionExpired(subscription);
        break;
      case "subscription_payment_success":
        await handlePaymentSuccess(subscription);
        break;
      case "subscription_payment_failed":
        await handlePaymentFailed(subscription);
        break;
      case "subscription_payment_recovery_failed":
        await handleSubscriptionUnpaid(subscription);
        break;
      default:
        console.log(`Unhandled event type: ${eventType}`);
    }

    // Record that we've processed this event
    await supabase
      .from('webhook_events')
      .insert({
        webhook_id: eventId,
        processed_at: new Date().toISOString(),
        ip_address: clientIP
      });

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Webhook processing failed:", {
      message: error instanceof Error ? error.message : "Unknown error",
    });
    return NextResponse.json({ error: "Webhook failed" }, { status: 500 });
  }
}

async function handleSubscriptionCreated(subscription: any, meta: any) {
  const userId =
    meta.custom_data?.user_id ||
    subscription.attributes?.checkout_data?.custom?.user_id ||
    subscription.attributes?.custom?.user_id;

  // Add validation
  if (!validateWebhookData(subscription, userId)) {
    throw new Error('Invalid webhook data');
  }

  // Check for existing subscription to prevent hijacking
  const { data: existingSub } = await supabase
    .from('user_subscriptions')
    .select('user_id')
    .eq('lemon_squeezy_id', subscription.id)
    .single();

  if (existingSub && existingSub.user_id !== userId) {
    throw new Error('Subscription ownership mismatch');
  }

  // Get plan details
  const planDetails = await getPlanDetails('pro');

  // Store full timestamps
  const renewsAt = subscription.attributes.renews_at;
  const createdAt = subscription.attributes.created_at;

  const insertData = {
    user_id: userId,
    lemon_squeezy_id: subscription.id,
    plan: "pro",
    status: subscription.attributes.status,
    usage_limit: planDetails.requests_limit,
    usage_count: 0,
    reset_date: getNextResetDate(),
    period_start: createdAt,
    period_end: renewsAt,
  };

  // Use user_id for conflict resolution since it has a unique constraint
  const { data, error } = await supabase
    .from("user_subscriptions")
    .upsert(insertData, { onConflict: "user_id" })
    .select();

  if (error) {
    console.error("Subscription creation failed:", {
      subscriptionId: subscription.id,
      message: error.message,
    });
    throw error;
  } else {
    console.log("Successfully inserted/updated subscription for user:", userId);
  }
}

async function handleSubscriptionUpdated(subscription: any) {
  // Get the user_id for this subscription first
  const { data: subData, error: fetchError } = await supabase
    .from('user_subscriptions')
    .select('user_id')
    .eq('lemon_squeezy_id', subscription.id)
    .single();

  if (fetchError || !subData) {
    throw new Error('Subscription not found for update');
  }

  if (!validateWebhookData(subscription, subData.user_id)) {
    throw new Error('Invalid webhook data');
  }

  // Store full timestamp
  const renewsAt = subscription.attributes.renews_at;
  const updateData: any = {
    status: subscription.attributes.status,
  };

  // Update period_end with full timestamp if we have a new renews_at
  if (renewsAt) {
    updateData.period_end = renewsAt;
  }

  const { data, error } = await supabase
    .from("user_subscriptions")
    .update(updateData)
    .eq("lemon_squeezy_id", subscription.id)
    .select();

  if (error) {
    console.error("Subscription update failed:", {
      subscriptionId: subscription.id,
      message: error.message,
    });
    throw error;
  } else {
    console.log("Successfully updated subscription:", subscription.id);
  }
}

async function handleSubscriptionCancelled(subscription: any) {
  // Get the user_id for this subscription first
  const { data: subData, error: fetchError } = await supabase
    .from('user_subscriptions')
    .select('user_id')
    .eq('lemon_squeezy_id', subscription.id)
    .single();

  if (fetchError || !subData) {
    throw new Error('Subscription not found for cancellation');
  }

  if (!validateWebhookData(subscription, subData.user_id)) {
    throw new Error('Invalid webhook data');
  }

  // When cancelled, user keeps access until period_end
  const endsAt = subscription.attributes.ends_at;
  const now = new Date();
  const endDate = new Date(endsAt);

  const updateData: any = {
    status: "cancelled",
  };

  // Update period_end to the exact cancellation end time if available
  if (endsAt) {
    updateData.period_end = endsAt;
  }

  // If the cancellation is effective immediately (end date has passed)
  if (endDate <= now) {
    const freePlanDetails = await getPlanDetails('free');
    updateData.plan = "free";
    updateData.usage_limit = freePlanDetails.requests_limit;
  }

  const { data, error } = await supabase
    .from("user_subscriptions")
    .update(updateData)
    .eq("lemon_squeezy_id", subscription.id)
    .select();

  if (error) {
    console.error("Cancel error:", error.message);
    throw error;
  } else {
    console.log("Successfully cancelled subscription:", subscription.id);
  }
}

async function handleSubscriptionResumed(subscription: any) {
  // Get the user_id for this subscription first
  const { data: subData, error: fetchError } = await supabase
    .from('user_subscriptions')
    .select('user_id')
    .eq('lemon_squeezy_id', subscription.id)
    .single();

  if (fetchError || !subData) {
    throw new Error('Subscription not found for resume');
  }

  if (!validateWebhookData(subscription, subData.user_id)) {
    throw new Error('Invalid webhook data');
  }

  const renewsAt = subscription.attributes.renews_at;
  const proPlanDetails = await getPlanDetails('pro');

  const { data, error } = await supabase
    .from("user_subscriptions")
    .update({
      status: "active",
      plan: "pro",
      usage_limit: proPlanDetails.requests_limit,
      period_end: renewsAt,
    })
    .eq("lemon_squeezy_id", subscription.id)
    .select();

  if (error) {
    console.error("Subscription resume failed:", {
      subscriptionId: subscription.id,
      message: error.message,
    });
    throw error;
  } else {
    console.log("Successfully resumed subscription:", subscription.id);
  }
}

async function handleSubscriptionExpired(subscription: any) {
  // Get the user_id for this subscription first
  const { data: subData, error: fetchError } = await supabase
    .from('user_subscriptions')
    .select('user_id')
    .eq('lemon_squeezy_id', subscription.id)
    .single();

  if (fetchError || !subData) {
    throw new Error('Subscription not found for expiration');
  }

  if (!validateWebhookData(subscription, subData.user_id)) {
    throw new Error('Invalid webhook data');
  }

  const freePlanDetails = await getPlanDetails('free');

  const { data, error } = await supabase
    .from("user_subscriptions")
    .update({
      status: "expired",
      plan: "free",
      usage_limit: freePlanDetails.requests_limit,
      // period_end stays the same - shows when it actually expired
    })
    .eq("lemon_squeezy_id", subscription.id)
    .select();

  if (error) {
    console.error("Subscription expiration failed:", {
      subscriptionId: subscription.id,
      message: error.message,
    });
    throw error;
  } else {
    console.log("Successfully expired subscription and downgraded to free:", subscription.id);
  }
}

async function handlePaymentSuccess(invoiceData: any) {
  const subscriptionId = invoiceData.attributes.subscription_id;

  // Get the user_id for this subscription first
  const { data: subData, error: fetchError } = await supabase
    .from('user_subscriptions')
    .select('user_id')
    .eq('lemon_squeezy_id', subscriptionId)
    .single();

  if (fetchError || !subData) {
    throw new Error('Subscription not found for payment success');
  }

  // Fetch the actual subscription data from Lemon Squeezy API
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout

    const subscriptionResponse = await fetch(
      `https://api.lemonsqueezy.com/v1/subscriptions/${subscriptionId}`,
      {
        signal: controller.signal,
        headers: {
          Authorization: `Bearer ${process.env.LEMON_SQUEEZY_API_KEY}`,
          Accept: "application/vnd.api+json",
        },
      }
    );

    clearTimeout(timeoutId);

    if (!subscriptionResponse.ok) {
      console.error("Failed to fetch subscription data");
      return;
    }

    const subscriptionData = await subscriptionResponse.json();
    const subscription = subscriptionData.data;

    if (!validateWebhookData(subscription, subData.user_id)) {
      throw new Error('Invalid subscription data from API');
    }

    const renewsAt = subscription.attributes.renews_at;
    if (!renewsAt) {
      console.error("Missing renews_at in subscription data");
      return;
    }

    const proPlanDetails = await getPlanDetails('pro');

    const { data, error } = await supabase
      .from("user_subscriptions")
      .update({
        status: "active",
        plan: "pro",
        usage_limit: proPlanDetails.requests_limit,
        period_end: renewsAt,
        reset_date: getNextResetDate(),
        usage_count: 0, // Reset usage on successful payment
        updated_at: new Date().toISOString(),
      })
      .eq("lemon_squeezy_id", subscriptionId);

    if (error) {
      console.error("Payment success update error:", error.message);
      throw error;
    } else {
      console.log("Successfully updated subscription after payment:", subscriptionId);
    }
  } catch (fetchError) {
    console.error("Subscription fetch failed:", {
      subscriptionId,
      message: fetchError instanceof Error ? fetchError.message : "Unknown error",
    });
    throw fetchError;
  }
}

async function handlePaymentFailed(subscription: any) {
  // Get the user_id for this subscription first
  const { data: subData, error: fetchError } = await supabase
    .from('user_subscriptions')
    .select('user_id')
    .eq('lemon_squeezy_id', subscription.id)
    .single();

  if (fetchError || !subData) {
    throw new Error('Subscription not found for payment failure');
  }

  if (!validateWebhookData(subscription, subData.user_id)) {
    throw new Error('Invalid webhook data');
  }

  const { data, error } = await supabase
    .from("user_subscriptions")
    .update({
      status: "past_due",
      // Don't change plan/usage_limit yet - user might still have grace period access
    })
    .eq("lemon_squeezy_id", subscription.id)
    .select();

  if (error) {
    console.error("Payment failed update error:", {
      subscriptionId: subscription.id,
      message: error.message,
    });
    throw error;
  } else {
    console.log("Successfully updated subscription after failed payment:", subscription.id);
  }
}

async function handleSubscriptionUnpaid(subscription: any) {
  // Get the user_id for this subscription first
  const { data: subData, error: fetchError } = await supabase
    .from('user_subscriptions')
    .select('user_id')
    .eq('lemon_squeezy_id', subscription.id)
    .single();

  if (fetchError || !subData) {
    throw new Error('Subscription not found for unpaid status');
  }

  if (!validateWebhookData(subscription, subData.user_id)) {
    throw new Error('Invalid webhook data');
  }

  const freePlanDetails = await getPlanDetails('free');

  const { data, error } = await supabase
    .from("user_subscriptions")
    .update({
      status: "unpaid",
      plan: "free",
      usage_limit: freePlanDetails.requests_limit,
    })
    .eq("lemon_squeezy_id", subscription.id)
    .select();

  if (error) {
    console.error("Subscription unpaid update failed:", {
      subscriptionId: subscription.id,
      message: error.message,
    });
    throw error;
  } else {
    console.log("Successfully marked subscription unpaid and downgraded to free:", subscription.id);
  }
}