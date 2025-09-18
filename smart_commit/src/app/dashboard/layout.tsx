// app/dashboard/layout.tsx
import { createClient } from "../lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";

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
  <div className="min-h-screen">
    <header className="bg-white border-b px-6 py-4 flex justify-between items-center">
      {/* Left side: Dashboard title */}
      <h1 className="text-xl font-bold text-gray-900">My Dashboard</h1>

      {/* Right side: user info and docs link grouped */}
      <div className="flex items-center space-x-6">
        {user && (
          <span className="text-sm text-gray-800 whitespace-nowrap">
            {user.user_metadata.full_name || user.email}
          </span>
        )}
        <Link href="/docs" className="text-sm text-blue-600 hover:underline">
          docs
        </Link>
      </div>
    </header>
    <main className="p-6">{children}</main>
  </div>
);
}

