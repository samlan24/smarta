import { createClient } from "../lib/supabase/server";

// Tempor debug version
export async function validateApiKey(apiKey: string) {
  try {
    const supabase = await createClient();

    console.log("Validating API key:", apiKey.substring(0, 10) + "...");

    const { data, error } = await supabase.rpc("get_user_by_api_key", {
      p_api_key: apiKey,
    });

    console.log("RPC response:", { data, error });

    if (error) {
      console.error("RPC error:", error);
      return { valid: false, error: "Database error" };
    }

    if (!data || data.length === 0) {
      console.log("No user found for API key");
      return { valid: false, error: "Invalid API key" };
    }

    const userData = data[0];
    console.log("User data:", userData);

    if (!userData.can_use_api) {
      return {
        valid: false,
        error:
          userData.subscription_status === "active"
            ? "Rate limit exceeded"
            : "Subscription inactive",
      };
    }

    return {
      valid: true,
      userId: userData.user_id,
      subscriptionStatus: userData.subscription_status,
    };
  } catch (error) {
    console.error("API key validation error:", error);
    return { valid: false, error: "Validation failed" };
  }
}
