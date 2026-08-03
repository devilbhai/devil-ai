import React, { useState, useRef } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Zap, Mail, Lock, ArrowRight, ArrowLeft, Loader2, KeyRound } from "lucide-react";

export function ForgotPassword() {
  const navigate = useNavigate();
  const [step, setStep] = useState<"email" | "code" | "password">("email");
  
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  
  const codeRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);

  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    
    setLoading(true);
    setError("");
    try {
      const res = await fetch("https://devil-ai.agribee.in/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email })
      });
      const data = await res.json();
      
      if (!res.ok) throw new Error(data.message || "Failed to send reset code");
      
      setSuccessMsg(data.message || "Reset code sent to your email.");
      setStep("code");
      setTimeout(() => codeRef.current?.focus(), 100);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code || code.length !== 6) {
      setError("Please enter a valid 6-digit code.");
      return;
    }
    
    setLoading(true);
    setError("");
    setSuccessMsg("");
    try {
      const res = await fetch("https://devil-ai.agribee.in/api/auth/verify-reset-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code })
      });
      const data = await res.json();
      
      if (!res.ok) throw new Error(data.message || "Invalid or expired code");
      
      setStep("password");
      setTimeout(() => passwordRef.current?.focus(), 100);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 8) {
      setError("Password must be at least 8 characters long.");
      return;
    }
    
    setLoading(true);
    setError("");
    try {
      const res = await fetch("https://devil-ai.agribee.in/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code, newPassword: password })
      });
      const data = await res.json();
      
      if (!res.ok) throw new Error(data.message || "Failed to reset password");
      
      // Auto login
      localStorage.setItem("devil-ai-token", data.token);
      localStorage.setItem("devil-ai-user", JSON.stringify(data.user));
      navigate({ to: "/" });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background text-foreground selection:bg-red-500/30">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))] opacity-40 dark:opacity-60" />
      
      <div className="z-10 w-full max-w-md space-y-8 rounded-2xl border border-black/10 dark:border-white/10 bg-black/5 dark:bg-white/5 p-8 backdrop-blur-xl shadow-2xl relative">
        <button 
          onClick={() => navigate({ to: "/login" })}
          className="absolute top-6 left-6 text-gray-500 hover:text-white transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>

        <div className="text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-red-500 to-red-700 shadow-[0_0_40px_rgba(239,68,68,0.4)]">
            <Zap className="h-8 w-8 text-white" />
          </div>
          <h2 className="mt-6 text-3xl font-bold tracking-tight text-black dark:text-white">Reset Password</h2>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            {step === "email" && "Enter your email to receive a reset code"}
            {step === "code" && "Enter the 6-digit code sent to your email"}
            {step === "password" && "Enter your new password"}
          </p>
        </div>

        <form 
          className="mt-8 space-y-6" 
          onSubmit={step === "email" ? handleSendCode : step === "code" ? handleVerifyCode : handleResetPassword}
        >
          {error && (
            <div className="rounded-lg bg-red-500/10 p-4 border border-red-500/20">
              <p className="text-sm text-red-400">{error}</p>
            </div>
          )}
          
          {successMsg && !error && step === "code" && (
            <div className="rounded-lg bg-green-500/10 p-4 border border-green-500/20">
              <p className="text-sm text-green-400">{successMsg}</p>
            </div>
          )}
          
          <div className="space-y-4">
            {step === "email" && (
              <div>
                <label htmlFor="reset-email" className="text-sm font-medium text-gray-700 dark:text-gray-300">Email address</label>
                <div className="relative mt-1">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                    <Mail className="h-5 w-5 text-gray-500" />
                  </div>
                  <input
                    id="reset-email"
                    type="email"
                    required
                    className="block w-full rounded-xl border border-black/10 dark:border-white/10 bg-white/50 dark:bg-black/50 py-3 pl-10 pr-3 text-black dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500 sm:text-sm transition-all"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              </div>
            )}

            {step === "code" && (
              <div>
                <label htmlFor="reset-code" className="text-sm font-medium text-gray-700 dark:text-gray-300">6-Digit Code</label>
                <div className="relative mt-1">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                    <KeyRound className="h-5 w-5 text-gray-500" />
                  </div>
                  <input
                    id="reset-code"
                    ref={codeRef}
                    type="text"
                    required
                    maxLength={6}
                    className="block w-full rounded-xl border border-black/10 dark:border-white/10 bg-white/50 dark:bg-black/50 py-3 pl-10 pr-3 text-black dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500 sm:text-sm transition-all tracking-widest text-center text-xl font-bold"
                    placeholder="------"
                    value={code}
                    onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                  />
                </div>
              </div>
            )}

            {step === "password" && (
              <div>
                <label htmlFor="new-password" className="text-sm font-medium text-gray-700 dark:text-gray-300">New Password</label>
                <div className="relative mt-1">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                    <Lock className="h-5 w-5 text-gray-500" />
                  </div>
                  <input
                    id="new-password"
                    ref={passwordRef}
                    type="password"
                    required
                    minLength={8}
                    className="block w-full rounded-xl border border-black/10 dark:border-white/10 bg-white/50 dark:bg-black/50 py-3 pl-10 pr-3 text-black dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500 sm:text-sm transition-all"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
                <p className="mt-2 text-xs text-gray-500">Must be at least 8 characters.</p>
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={loading || (step === "code" && code.length !== 6)}
            className="group relative flex w-full justify-center rounded-xl bg-gradient-to-r from-red-600 to-red-500 px-4 py-3 text-sm font-semibold text-white hover:from-red-500 hover:to-red-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:ring-offset-[#0d0d0d] disabled:opacity-70 transition-all"
          >
            {loading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <span className="flex items-center gap-2">
                {step === "email" && "Send Reset Code"}
                {step === "code" && "Verify Code"}
                {step === "password" && "Reset Password & Login"}
                <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </span>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
