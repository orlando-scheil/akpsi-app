// Editable profile form — used on /profile for both first-time setup and ongoing edits.
// Handles all Member fields, avatar upload, and calls setMember / updateMember on submit.
"use client";

import { useState, useRef, useEffect } from "react";
import { Camera, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { BigCombobox } from "@/components/ui/BigCombobox";
import { setMember, updateMember, getMembers, linkBigLittles } from "@/lib/firestore";
import { uploadAvatar } from "@/lib/storage";
import type { Member, SocialLink } from "@/types/member";

interface ProfileFormProps {
  uid: string;
  /** Firebase Auth email — used on first-time creation when existing is null */
  email: string;
  /** Existing member doc — null if this is first-time setup */
  existing: Member | null;
  /** Called after a successful save so the parent can refresh auth context */
  onSaved: () => Promise<void>;
}

const CURRENT_YEAR = new Date().getFullYear();
const GRAD_YEARS = Array.from({ length: 8 }, (_, i) => CURRENT_YEAR - 1 + i);
const PLEDGE_YEARS = Array.from({ length: 10 }, (_, i) => CURRENT_YEAR - 7 + i);

export function ProfileForm({ uid, email, existing, onSaved }: ProfileFormProps) {
  // ── Required fields ──────────────────────────────────────────────────────────
  const [firstName, setFirstName] = useState(existing?.firstName ?? "");
  const [lastName, setLastName] = useState(existing?.lastName ?? "");
  const [major, setMajor] = useState(existing?.major ?? "");
  const [graduationYear, setGraduationYear] = useState(
    existing?.graduationYear ?? CURRENT_YEAR + 2
  );
  const [pledgeClassQuarter, setPledgeClassQuarter] = useState<"Fall" | "Spring">(
    existing?.pledgeClassQuarter ?? "Fall"
  );
  const [pledgeClassYear, setPledgeClassYear] = useState(
    existing?.pledgeClassYear ?? CURRENT_YEAR
  );

  // ── Optional fields ──────────────────────────────────────────────────────────
  const [preferredName, setPreferredName] = useState(existing?.preferredName ?? "");
  const [status, setStatus] = useState<Member["status"]>(existing?.status ?? "active");
  const [role, setRole] = useState(existing?.role ?? "");
  const [bigName, setBigName] = useState(existing?.bigName ?? "");
  const [bigUid, setBigUid] = useState<string | null>(existing?.bigUid ?? null);
  const [phone, setPhone] = useState(existing?.phone ?? "");
  const [preferredContact, setPreferredContact] = useState(
    existing?.preferredContact ?? ""
  );
  const [bio, setBio] = useState(existing?.bio ?? "");
  const [industriesRaw, setIndustriesRaw] = useState(
    existing?.industries.join(", ") ?? ""
  );
  const [socialLinks, setSocialLinks] = useState<SocialLink[]>(
    existing?.socialLinks ?? []
  );

  // ── Members list for big combobox ────────────────────────────────────────────
  const [members, setMembers] = useState<Member[]>([]);
  useEffect(() => {
    getMembers().then((all) =>
      // Exclude self from the picker
      setMembers(all.filter((m) => m.uid !== uid))
    );
  }, [uid]);

  // ── Avatar ───────────────────────────────────────────────────────────────────
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(
    existing?.profilePhotoUrl ?? null
  );
  const avatarInputRef = useRef<HTMLInputElement>(null);

  function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
    e.target.value = "";
  }

  // ── Social links ─────────────────────────────────────────────────────────────
  function addSocialLink() {
    setSocialLinks((prev) => [...prev, { platform: "", url: "" }]);
  }

  function updateSocialLink(index: number, field: keyof SocialLink, value: string) {
    setSocialLinks((prev) =>
      prev.map((link, i) => (i === index ? { ...link, [field]: value } : link))
    );
  }

  function removeSocialLink(index: number) {
    setSocialLinks((prev) => prev.filter((_, i) => i !== index));
  }

  // ── Submit ────────────────────────────────────────────────────────────────────
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isValid =
    firstName.trim() &&
    lastName.trim() &&
    major.trim() &&
    bigName.trim();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isValid || submitting) return;
    setSubmitting(true);
    setError(null);

    try {
      let profilePhotoUrl = existing?.profilePhotoUrl ?? null;
      if (avatarFile) {
        profilePhotoUrl = await uploadAvatar(uid, avatarFile);
      }

      const industries = industriesRaw
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);

      const validLinks = socialLinks.filter((l) => l.platform.trim() && l.url.trim());

      const data: Omit<Member, "uid"> = {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        preferredName: preferredName.trim() || null,
        profilePhotoUrl,
        major: major.trim(),
        graduationYear,
        pledgeClassQuarter,
        pledgeClassYear,
        status,
        role: role.trim() || null,
        familyId: existing?.familyId ?? null,
        familyName: existing?.familyName ?? null,
        bigUid,
        bigName: bigName.trim() || null,
        email: existing?.email ?? email,
        phone: phone.trim() || null,
        preferredContact: preferredContact || null,
        bio: bio.trim() || null,
        industries,
        socialLinks: validLinks,
        joinedAt: existing?.joinedAt ?? new Date(),
        lastActive: new Date(),
        isAdmin: existing?.isAdmin ?? false,
      };

      if (existing) {
        await updateMember(uid, data);
      } else {
        await setMember(uid, data);
      }

      // Auto-link big/little relationships when relevant fields change
      const shouldLink =
        !existing ||
        data.firstName !== existing.firstName ||
        data.lastName !== existing.lastName ||
        data.bigName !== existing.bigName;

      if (shouldLink) {
        await linkBigLittles(uid, {
          firstName: data.firstName,
          lastName: data.lastName,
          bigName: data.bigName,
          bigUid: data.bigUid,
        });
      }

      await onSaved();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  }

  const initials = `${firstName.charAt(0)}${lastName.charAt(0)}` || "?";

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-8">
      {/* ── Avatar ─────────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-4">
        <div className="relative shrink-0">
          <Avatar className="h-20 w-20">
            <AvatarImage src={avatarPreview ?? undefined} alt="Profile photo" />
            <AvatarFallback className="bg-primary text-primary-foreground text-xl font-semibold">
              {initials}
            </AvatarFallback>
          </Avatar>
          <button
            type="button"
            onClick={() => avatarInputRef.current?.click()}
            className="absolute bottom-0 right-0 flex h-7 w-7 items-center justify-center rounded-full bg-primary text-primary-foreground shadow hover:bg-primary/90 transition-colors"
            aria-label="Upload photo"
          >
            <Camera className="h-3.5 w-3.5" />
          </button>
          <input
            ref={avatarInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleAvatarChange}
          />
        </div>
        <div>
          <p className="font-semibold">
            {firstName || "First"} {lastName || "Last"}
          </p>
          <p className="text-sm text-muted-foreground">
            {existing ? "Update your profile photo" : "Add a profile photo"}
          </p>
        </div>
      </div>

      {/* ── Required ───────────────────────────────────────────────────────── */}
      <section className="flex flex-col gap-5 border-t pt-6">
        <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          Required
        </h2>

        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium">First name</label>
            <Input value={firstName} onChange={(e) => setFirstName(e.target.value)} required />
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium">Last name</label>
            <Input value={lastName} onChange={(e) => setLastName(e.target.value)} required />
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium">Major</label>
          <Input value={major} onChange={(e) => setMajor(e.target.value)} required />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium">Pledge class quarter</label>
            <Select
              value={pledgeClassQuarter}
              onValueChange={(v) => setPledgeClassQuarter(v as "Fall" | "Spring")}
            >
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Fall">Fall</SelectItem>
                <SelectItem value="Spring">Spring</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium">Pledge class year</label>
            <Select
              value={String(pledgeClassYear)}
              onValueChange={(v) => setPledgeClassYear(Number(v))}
            >
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {PLEDGE_YEARS.map((y) => (
                  <SelectItem key={y} value={String(y)}>{y}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium">Big</label>
          <BigCombobox
            members={members}
            value={bigName}
            bigUid={bigUid}
            onChange={(name, uid) => {
              setBigName(name);
              setBigUid(uid);
            }}
            placeholder="Search by name…"
          />
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium">Graduation year</label>
          <Select
            value={String(graduationYear)}
            onValueChange={(v) => setGraduationYear(Number(v))}
          >
            <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
            <SelectContent>
              {GRAD_YEARS.map((y) => (
                <SelectItem key={y} value={String(y)}>{y}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </section>

      {/* ── Optional ───────────────────────────────────────────────────────── */}
      <section className="flex flex-col gap-5 border-t pt-6">
        <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          Optional
        </h2>

        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium">Preferred name</label>
            <Input
              placeholder="If different from first name"
              value={preferredName}
              onChange={(e) => setPreferredName(e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium">Status</label>
            <Select value={status} onValueChange={(v) => setStatus(v as Member["status"])}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="alumni">Alumni</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium">Chapter role</label>
          <Input
            placeholder="e.g. President, VP Finance"
            value={role}
            onChange={(e) => setRole(e.target.value)}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium">Phone</label>
            <Input
              placeholder="(206) 555-0100"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium">Preferred contact</label>
            <Select
              value={preferredContact}
              onValueChange={(v) => setPreferredContact(v ?? "")}
            >
              <SelectTrigger><SelectValue placeholder="Select…" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="email">Email</SelectItem>
                <SelectItem value="phone">Phone</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium">Bio</label>
          <Textarea
            placeholder="Tell the chapter a bit about yourself…"
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            rows={3}
          />
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium">Industries of interest</label>
          <Input
            placeholder="Finance, Technology, Consulting (comma-separated)"
            value={industriesRaw}
            onChange={(e) => setIndustriesRaw(e.target.value)}
          />
        </div>

        {/* Social links */}
        <div className="flex flex-col gap-3">
          <label className="text-sm font-medium">Social links</label>
          {socialLinks.map((link, i) => (
            <div key={i} className="flex gap-2 items-center">
              <Input
                placeholder="Platform (e.g. LinkedIn)"
                value={link.platform}
                onChange={(e) => updateSocialLink(i, "platform", e.target.value)}
                className="w-36"
              />
              <Input
                placeholder="URL"
                value={link.url}
                onChange={(e) => updateSocialLink(i, "url", e.target.value)}
              />
              <button
                type="button"
                onClick={() => removeSocialLink(i)}
                className="text-muted-foreground hover:text-destructive transition-colors"
                aria-label="Remove"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ))}
          <Button type="button" variant="outline" size="sm" onClick={addSocialLink} className="w-fit">
            <Plus className="h-4 w-4 mr-1" />
            Add link
          </Button>
        </div>
      </section>

      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}

      <Button type="submit" disabled={!isValid || submitting} className="w-fit">
        {submitting ? "Saving…" : existing ? "Save changes" : "Complete profile"}
      </Button>
    </form>
  );
}
