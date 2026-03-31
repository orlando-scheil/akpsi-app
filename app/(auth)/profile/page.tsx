// Profile page — lets members view and edit their own profile.
// Also serves as the first-time setup page for new members.
"use client";

import { useAuth } from "@/lib/auth";
import { ProfileForm } from "@/components/profile/ProfileForm";

export default function ProfilePage() {
  const { user, member, refreshMember } = useAuth();

  if (!user) return null;

  const isNewMember = !member;

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold">
          {isNewMember ? "Complete your profile" : "My Profile"}
        </h1>
        {isNewMember && (
          <p className="text-muted-foreground mt-1">
            Fill in your details so the chapter can find and connect with you.
          </p>
        )}
      </div>

      <ProfileForm uid={user.uid} existing={member} onSaved={refreshMember} />
    </div>
  );
}
