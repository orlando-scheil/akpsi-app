// Auth-gated layout — wraps all routes under (auth)/.
// Redirects unauthenticated users to /login; redirects users without a profile to /profile.
"use client";

import { useRouter, usePathname } from "next/navigation";
import { useEffect } from "react";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/lib/auth";
import Navbar from "@/components/Navbar";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, member, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace("/login");
      return;
    }
    // If the user has no profile doc and isn't already on /profile, send them there
    if (!member && pathname !== "/profile") {
      router.replace("/profile");
    }
  }, [user, member, loading, pathname, router]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <>
      <Navbar />
      {children}
    </>
  );
}
