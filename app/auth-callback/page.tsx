"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, Mail, Loader2, AlertCircle } from "lucide-react";

export default function AuthCallbackPage() {
  const router = useRouter();
  const { signInWithEmailLinkHandler, isEmailLinkValid } = useAuth();
  const [loading, setLoading] = useState(true);
  const [emailConfirmation, setEmailConfirmation] = useState("");
  const [needsEmailConfirmation, setNeedsEmailConfirmation] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleEmailLink = async () => {
      const urlParams = new URLSearchParams(window.location.search);
      const emailLink = window.location.href;

      // Check if this is a valid email link
      if (!isEmailLinkValid(emailLink)) {
        setError("Invalid or expired sign-in link");
        setLoading(false);
        return;
      }

      // Try to get email from localStorage
      let email = window.localStorage.getItem("emailForSignIn");

      if (!email) {
        // Email not found in localStorage, ask user to confirm
        setNeedsEmailConfirmation(true);
        setLoading(false);
        return;
      }

      try {
        await signInWithEmailLinkHandler(email, emailLink);
        setSuccess(true);

        toast({
          title: "Successfully signed in!",
          description: "Welcome to EventHub. Redirecting...",
        });

        // Redirect after a short delay
        setTimeout(() => {
          router.push("/");
        }, 2000);
      } catch (error: any) {
        console.error("Email link sign-in error:", error);
        setError(error.message || "Failed to sign in with email link");
      } finally {
        setLoading(false);
      }
    };

    handleEmailLink();
  }, [isEmailLinkValid, signInWithEmailLinkHandler, router]);

  const handleEmailConfirmation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailConfirmation) return;

    setLoading(true);
    try {
      const emailLink = window.location.href;
      await signInWithEmailLinkHandler(emailConfirmation, emailLink);
      setSuccess(true);

      toast({
        title: "Successfully signed in!",
        description: "Welcome to EventHub. Redirecting...",
      });

      // Redirect after a short delay
      setTimeout(() => {
        router.push("/");
      }, 2000);
    } catch (error: any) {
      console.error("Email confirmation error:", error);
      setError(error.message || "Failed to sign in with email link");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600 mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Completing sign-in...
            </h2>
            <p className="text-gray-600 text-center">
              Please wait while we verify your email link
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-6">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Welcome to EventHub!
            </h2>
            <p className="text-gray-600 text-center mb-6">
              You've been successfully signed in. Redirecting...
            </p>
            <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-6">
              <AlertCircle className="w-8 h-8 text-red-600" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Sign-in Failed
            </h2>
            <p className="text-gray-600 text-center mb-6">{error}</p>
            <Button
              onClick={() => router.push("/auth")}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
            >
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (needsEmailConfirmation) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-center flex items-center justify-center">
              <Mail className="w-6 h-6 mr-2 text-blue-600" />
              Confirm Your Email
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 text-center mb-6">
              To complete sign-in, please confirm the email address where you
              received the sign-in link.
            </p>

            <form onSubmit={handleEmailConfirmation} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  value={emailConfirmation}
                  onChange={(e) => setEmailConfirmation(e.target.value)}
                  placeholder="Enter your email address"
                  required
                  className="h-12"
                />
              </div>

              <Button
                type="submit"
                disabled={loading || !emailConfirmation}
                className="w-full h-12 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
              >
                {loading ? (
                  <div className="flex items-center space-x-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Confirming...</span>
                  </div>
                ) : (
                  "Complete Sign-in"
                )}
              </Button>
            </form>

            <p className="text-xs text-gray-500 text-center mt-4">
              This security step helps prevent unauthorized access to your
              account.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return null;
}
