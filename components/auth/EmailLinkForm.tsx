"use client";

import type React from "react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import { Mail, Send, CheckCircle, Sparkles } from "lucide-react";

interface EmailLinkFormProps {
  onSuccess?: () => void;
}

export function EmailLinkForm({ onSuccess }: EmailLinkFormProps) {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const { sendEmailLink } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setLoading(true);

    try {
      await sendEmailLink(email);
      setEmailSent(true);
      toast({
        title: "Magic link sent!",
        description:
          "Check your email for a sign-in link. It may take a few minutes to arrive.",
      });
    } catch (error: any) {
      toast({
        title: "Failed to send link",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setLoading(true);
    try {
      await sendEmailLink(email);
      toast({
        title: "Link resent!",
        description: "Check your email for a new sign-in link.",
      });
    } catch (error: any) {
      toast({
        title: "Failed to resend link",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (emailSent) {
    return (
      <div className="space-y-6 text-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <div className="space-y-2">
            <h3 className="text-xl font-semibold text-white">
              Check your email
            </h3>
            <p className="text-gray-300 text-sm">
              We've sent a magic link to <strong>{email}</strong>
            </p>
            <p className="text-gray-400 text-xs">
              Click the link in your email to sign in. The link will expire in 1
              hour.
            </p>
          </div>
        </div>

        <div className="space-y-3">
          <Button
            type="button"
            variant="outline"
            onClick={handleResend}
            disabled={loading}
            className="w-full h-12 border-gray-600 text-gray-200 hover:bg-gray-700"
          >
            {loading ? (
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                <span>Resending...</span>
              </div>
            ) : (
              <>
                <Send className="w-4 h-4 mr-2" />
                Resend link
              </>
            )}
          </Button>

          <Button
            type="button"
            variant="ghost"
            onClick={() => {
              setEmailSent(false);
              setEmail("");
            }}
            className="w-full text-gray-400 hover:text-gray-200"
          >
            Use a different email
          </Button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <div className="text-center space-y-2 mb-6">
          <div className="w-16 h-16 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <Sparkles className="w-8 h-8 text-white" />
          </div>
          <h3 className="text-xl font-semibold text-white">
            Passwordless Sign-in
          </h3>
          <p className="text-gray-300 text-sm">
            Enter your email and we'll send you a secure magic link to sign in
            instantly - no password required!
          </p>
        </div>

        <div className="space-y-2">
          <Label
            htmlFor="email-link"
            className="text-sm font-medium text-white"
          >
            Email Address
          </Label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <Input
              id="email-link"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="pl-10 h-12 border-transparent bg-slate-700/60 text-white focus:border-purple-500 focus:ring-2 focus:ring-purple-500/50 shadow-inner rounded-xl placeholder-gray-300"
              placeholder="Enter your email"
              required
            />
          </div>
        </div>
      </div>

      <Button
        type="submit"
        disabled={loading || !email}
        className="w-full h-14 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold text-lg shadow-lg hover:shadow-xl transition-all duration-300"
      >
        {loading ? (
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            <span>Sending link...</span>
          </div>
        ) : (
          <>
            <Send className="w-5 h-5 mr-2" />
            Send magic link
          </>
        )}
      </Button>

      <p className="text-xs text-gray-400 text-center">
        Magic links are secure, one-time use links that expire in 1 hour. No
        password needed!
      </p>
    </form>
  );
}
