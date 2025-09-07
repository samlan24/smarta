// app/dashboard/page.tsx
import { createClient } from "../lib/supabase/server";
import SignOutButton from "../components/auth/SignOutButton";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <div className="rounded-xl bg-white shadow p-6 ">
      <h2 className="text-2xl font-bold mb-2 text-gray-800">
        Welcome, {user?.user_metadata.full_name || "Google User"} 👋
      </h2>
      <p className="text-gray-600">{user?.email}</p>
      <SignOutButton />
    </div>
  );
}
