'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { createBrowserClient } from '@supabase/ssr';

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function SignOutButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleSignOut() {
    setLoading(true);
    const { error } = await supabase.auth.signOut();
    setLoading(false);

    if (error) {
      console.error('Error signing out:', error.message);
      return;
    }

    // After sign out, redirect to home or login page
    router.push('/');
  }

  return (
    <button
      onClick={handleSignOut}
      disabled={loading}
      className="btn btn-primary text-gray-600 mt-4"
    >
      {loading ? 'Signing Out...' : 'Sign Out'}
    </button>
  );
}
