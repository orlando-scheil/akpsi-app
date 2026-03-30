"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import {
  onAuthStateChanged,
  signInWithPopup,
  signOut as firebaseSignOut,
  GoogleAuthProvider,
  type User,
} from "firebase/auth";
import { auth } from "@/lib/firebase";
import { getMember } from "@/lib/firestore";
import type { Member } from "@/types/member";

interface AuthContextValue {
  user: User | null;
  member: Member | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  refreshMember: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const ALLOWED_DOMAIN = "uw.edu";
const SKIP_AUTH = process.env.NEXT_PUBLIC_SKIP_AUTH === "true";

const MOCK_USER = {
  uid: "dev-user",
  email: "dev@uw.edu",
  displayName: "Dev User",
  photoURL: null,
} as User;

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(SKIP_AUTH ? MOCK_USER : null);
  const [member, setMember] = useState<Member | null>(null);
  const [loading, setLoading] = useState(!SKIP_AUTH);

  async function fetchMember(uid: string) {
    try {
      const m = await getMember(uid);
      setMember(m);
    } catch {
      setMember(null);
    }
  }

  useEffect(() => {
    if (SKIP_AUTH) {
      fetchMember(MOCK_USER.uid).finally(() => setLoading(false));
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        await fetchMember(firebaseUser.uid);
      } else {
        setMember(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const signInWithGoogle = useCallback(async () => {
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ hd: ALLOWED_DOMAIN });

    const result = await signInWithPopup(auth, provider);
    const email = result.user.email ?? "";

    if (!email.endsWith(`@${ALLOWED_DOMAIN}`)) {
      await firebaseSignOut(auth);
      throw new Error("Please sign in with your @uw.edu email address.");
    }
  }, []);

  const signOut = useCallback(async () => {
    await firebaseSignOut(auth);
    setMember(null);
  }, []);

  const refreshMember = useCallback(async () => {
    if (user) await fetchMember(user.uid);
  }, [user]);

  return (
    <AuthContext.Provider value={{ user, member, loading, signInWithGoogle, signOut, refreshMember }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
