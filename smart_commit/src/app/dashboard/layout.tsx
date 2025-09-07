// app/dashboard/layout.tsx
import { createClient } from "../lib/supabase/server";
import { redirect } from "next/navigation";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/signin");
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b px-6 py-4 flex justify-between items-center">
        <h1 className="text-xl font-bold text-gray-900">My Dashboard</h1>
        {user && (
          <span className="text-sm text-gray-800">
            {user.user_metadata.full_name || user.email}
          </span>
        )}
      </header>
      <main className="p-6">{children}</main>
    </div>
  );
}

