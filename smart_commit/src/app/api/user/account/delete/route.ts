// /api/user/account/delete/route.ts
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { getUserPlan } from '../../../../lib/planManager';

export async function DELETE() {
  const cookieStore = await cookies();

  // Client for user authentication (using anon key)
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name) {
          return cookieStore.get(name)?.value;
        },
      },
    }
  );

  // Admin client for user deletion (using service role key)
  const supabaseAdmin = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      cookies: {
        get(name) {
          return cookieStore.get(name)?.value;
        },
      },
    }
  );

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Check subscription status before deletion
    const { data: subscription } = await supabaseAdmin
      .from("user_subscriptions")
      .select("*, subscription_plans(name)")
      .eq("user_id", user.id)
      .single();

    if (subscription) {
      const now = new Date();
      const resetDate = new Date(subscription.reset_date);

      // Prevent deletion if subscription is active or cancelled but still within period
      const hasActiveSubscription =
        subscription.status === "active" ||
        subscription.status === "past_due" ||
        (subscription.status === "cancelled" && now <= resetDate);

      // Only allow deletion for free plans or truly expired subscriptions
      const canDelete =
        subscription.plan === "free" ||
        subscription.status === "expired" ||
        (subscription.status === "cancelled" && now > resetDate);

      if (hasActiveSubscription && !canDelete) {
        const planName = subscription.subscription_plans?.name || subscription.plan;
        const daysRemaining = Math.ceil((resetDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

        return Response.json({
          error: "Cannot delete account with active subscription",
          message: `You have an active ${planName} subscription that expires on ${resetDate.toLocaleDateString()}. Please cancel your subscription first and wait ${daysRemaining} days for it to expire.`,
          subscriptionInfo: {
            plan: planName,
            status: subscription.status,
            expiresAt: subscription.reset_date,
            daysRemaining
          },
          actionRequired: "cancel_subscription"
        }, { status: 403 });
      }
    }

    // Proceed with comprehensive data deletion using admin client
    console.log(`Starting account deletion for user: ${user.id}`);

    // Delete in reverse dependency order to avoid foreign key constraints
    await supabaseAdmin.from("usage_logs").delete().eq("user_id", user.id);
    console.log("Deleted usage logs");

    await supabaseAdmin.from("external_commits").delete().eq("user_id", user.id);
    console.log("Deleted external commits");

    await supabaseAdmin.from("external_repositories").delete().eq("user_id", user.id);
    console.log("Deleted external repositories");

    await supabaseAdmin.from("git_integrations").delete().eq("user_id", user.id);
    console.log("Deleted git integrations");

    await supabaseAdmin.from("user_templates").delete().eq("user_id", user.id);
    console.log("Deleted user templates");

    await supabaseAdmin.from("commit_analytics").delete().eq("user_id", user.id);
    console.log("Deleted commit analytics");

    await supabaseAdmin.from("user_api_keys").delete().eq("user_id", user.id);
    console.log("Deleted API keys");

    await supabaseAdmin.from("user_subscriptions").delete().eq("user_id", user.id);
    console.log("Deleted subscription");

    await supabaseAdmin.from("user_profiles").delete().eq("user_id", user.id);
    console.log("Deleted user profile");

    // Delete the auth user using admin client
    const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(user.id);

    if (deleteError) {
      console.error("Failed to delete auth user:", deleteError);
      throw deleteError;
    }

    console.log(`Successfully completed account deletion for user: ${user.id}`);
    return Response.json({
      success: true,
      message: "Account successfully deleted"
    });

  } catch (error) {
    console.error("Delete account error:", {
      userId: user.id,
      message: error instanceof Error ? error.message : "Unknown error",
      timestamp: new Date().toISOString(),
    });

    return Response.json(
      { error: "Failed to delete account. Please contact support if the issue persists." },
      { status: 500 }
    );
  }
}

/**
 * Check deletion eligibility (GET endpoint)
 */
export async function GET() {
  const cookieStore = await cookies();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name) {
          return cookieStore.get(name)?.value;
        },
      },
    }
  );

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const planInfo = await getUserPlan(user.id);

    if (!planInfo) {
      return Response.json({
        canDelete: true,
        plan: "free",
        message: "Account can be deleted immediately"
      });
    }

    const now = new Date();
    const resetDate = new Date(planInfo.reset_date);

    // Check if subscription allows deletion
    const canDelete =
      planInfo.planId === "free" ||
      resetDate <= now;

    if (canDelete) {
      return Response.json({
        canDelete: true,
        plan: planInfo.planName,
        message: planInfo.planId === "free"
          ? "Account can be deleted immediately"
          : "Subscription has expired, account can be deleted"
      });
    } else {
      const daysRemaining = Math.ceil((resetDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

      return Response.json({
        canDelete: false,
        plan: planInfo.planName,
        subscriptionInfo: {
          expiresAt: planInfo.reset_date,
          daysRemaining
        },
        message: `Active ${planInfo.planName} subscription must be cancelled first. ${daysRemaining} days remaining.`
      });
    }

  } catch (error) {
    console.error("Error checking deletion eligibility:", {
      userId: user.id,
      error: error instanceof Error ? error.message : "Unknown error",
      timestamp: new Date().toISOString(),
    });

    return Response.json({
      error: "Failed to check account status"
    }, { status: 500 });
  }
}