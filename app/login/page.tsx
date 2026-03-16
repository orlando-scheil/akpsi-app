// Login page — Google sign-in restricted to @uw.edu accounts.
// Redirects authenticated users to /announcements.
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Alert,
  CircularProgress,
} from "@mui/material";
import GoogleIcon from "@mui/icons-material/Google";
import { useAuth } from "@/lib/auth";

export default function LoginPage() {
  const { user, loading, signInWithGoogle } = useAuth();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [signingIn, setSigningIn] = useState(false);

  if (loading) {
    return (
      <Box className="flex min-h-screen items-center justify-center">
        <CircularProgress />
      </Box>
    );
  }

  useEffect(() => {
    if (user) router.replace("/announcements");
  }, [user, router]);

  if (user) return null;

  const handleSignIn = async () => {
    setError(null);
    setSigningIn(true);
    try {
      await signInWithGoogle();
      router.replace("/announcements");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Sign-in failed. Please try again."
      );
    } finally {
      setSigningIn(false);
    }
  };

  return (
    <Box className="flex min-h-screen items-center justify-center px-4">
      <Card sx={{ maxWidth: 420, width: "100%" }} elevation={3}>
        <CardContent className="flex flex-col items-center gap-6 p-8">
          <Box className="flex flex-col items-center gap-2">
            <Typography variant="h4" component="h1" color="primary" fontWeight={700}>
              AKPsi UW
            </Typography>
            <Typography variant="body2" color="text.secondary" textAlign="center">
              Alpha Kappa Psi — University of Washington
            </Typography>
          </Box>

          <Box className="flex flex-col items-center gap-3 w-full">
            <Typography variant="body2" color="text.secondary">
              Sign in with your @uw.edu Google account
            </Typography>

            {error && (
              <Alert severity="error" sx={{ width: "100%" }}>
                {error}
              </Alert>
            )}

            <Button
              variant="contained"
              size="large"
              fullWidth
              startIcon={
                signingIn ? (
                  <CircularProgress size={20} color="inherit" />
                ) : (
                  <GoogleIcon />
                )
              }
              onClick={handleSignIn}
              disabled={signingIn}
            >
              {signingIn ? "Signing in…" : "Sign in with Google"}
            </Button>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}
