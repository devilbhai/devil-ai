import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Zap, Mail, Lock, ArrowRight, Loader2 } from "lucide-react";

export function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [requireForce, setRequireForce] = useState(false);
  const [deviceId, setDeviceId] = useState("");
  const passwordRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let id = localStorage.getItem("devil-ai-device-id");
    if (!id) {
      id = crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2);
      localStorage.setItem("devil-ai-device-id", id);
    }
    setDeviceId(id);
  }, []);

  const handleLogin = async (e?: React.FormEvent, forceLogin = false) => {
    if (e) e.preventDefault();
    setLoading(true);
    setError("");
    
    try {
      const res = await fetch("https://devil-ai.agribee.in/api/auth/user-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, deviceId, force: forceLogin })
      });
      
      const data = await res.json();
      
      if (res.status === 409 && data.requireForce) {
        setRequireForce(true);
        throw new Error(data.message);
      }

      // Account banned — redirect to full-screen banned page
      if (res.status === 403 && data.banned) {
        localStorage.removeItem("devil-ai-token");
        localStorage.removeItem("devil-ai-user");
        navigate({ to: "/banned" });
        return;
      }
      
      if (!res.ok) throw new Error(data.message || "Login failed");
      
      localStorage.setItem("devil-ai-token", data.token);
      localStorage.setItem("devil-ai-user", JSON.stringify(data.user));
      
      const hasActivePlan = data.user.subscriptions?.some(
        (sub: any) => sub.status === "ACTIVE"
      );
      
      if (!hasActivePlan) {
        navigate({ to: "/settings/account" });
      } else {
        navigate({ to: "/" });
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background text-foreground selection:bg-red-500/30">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))] opacity-40 dark:opacity-60" />
      
      <div className="z-10 w-full max-w-md space-y-8 rounded-2xl border border-black/10 dark:border-white/10 bg-black/5 dark:bg-white/5 p-8 backdrop-blur-xl shadow-2xl">
        <div className="text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-red-500 to-red-700 shadow-[0_0_40px_rgba(239,68,68,0.4)]">
            <Zap className="h-8 w-8 text-white" />
          </div>
          <h2 className="mt-6 text-3xl font-bold tracking-tight text-black dark:text-white">Welcome back</h2>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">Sign in to your Devil-AI account</p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={(e) => handleLogin(e, false)}>
          {error && (
            <div className="rounded-lg bg-red-500/10 p-4 border border-red-500/20">
              <p className="text-sm text-red-400">{error}</p>
              {requireForce && (
                <button
                  type="button"
                  onClick={() => handleLogin(undefined, true)}
                  disabled={loading}
                  className="mt-3 w-full rounded-lg bg-red-600 px-3 py-2 text-sm font-medium text-white hover:bg-red-500 transition-colors"
                >
                  Continue & Logout Other PC
                </button>
              )}
            </div>
          )}
          
          <div className="space-y-4">
            <div>
              <label htmlFor="login-email" className="text-sm font-medium text-gray-700 dark:text-gray-300">Email address</label>
              <div className="relative mt-1">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <Mail className="h-5 w-5 text-gray-500" />
                </div>
                <input
                  id="login-email"
                  type="email"
                  required
                  className="block w-full rounded-xl border border-black/10 dark:border-white/10 bg-white/50 dark:bg-black/50 py-3 pl-10 pr-3 text-black dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500 sm:text-sm transition-all"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === "Tab") {
                      e.preventDefault();
                      passwordRef.current?.focus();
                    }
                  }}
                />
              </div>
            </div>

            <div>
              <label htmlFor="login-password" className="text-sm font-medium text-gray-700 dark:text-gray-300">Password</label>
              <div className="relative mt-1">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <Lock className="h-5 w-5 text-gray-500" />
                </div>
                <input
                  id="login-password"
                  ref={passwordRef}
                  type="password"
                  required
                  className="block w-full rounded-xl border border-black/10 dark:border-white/10 bg-white/50 dark:bg-black/50 py-3 pl-10 pr-3 text-black dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500 sm:text-sm transition-all"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
              <div className="mt-2 flex justify-end">
                <button
                  type="button"
                  onClick={() => navigate({ to: "/forgot-password" })}
                  className="font-medium text-xs text-red-400 hover:text-red-300 transition-colors bg-transparent border-none p-0 cursor-pointer"
                >
                  Forgot password?
                </button>
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="group relative flex w-full justify-center rounded-xl bg-gradient-to-r from-red-600 to-red-500 px-4 py-3 text-sm font-semibold text-white hover:from-red-500 hover:to-red-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:ring-offset-[#0d0d0d] disabled:opacity-70 transition-all"
          >
            {loading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <span className="flex items-center gap-2">
                Sign In
                <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </span>
            )}
          </button>
        </form>

        <p className="mt-8 text-center text-sm text-gray-500 dark:text-gray-400">
          Not a member?{" "}
          <button onClick={() => navigate({ to: "/signup" })} className="font-medium text-red-400 hover:text-red-300 transition-colors">
            Create an account
          </button>
        </p>
        
        <div className="mt-6 flex justify-center gap-4 text-xs text-gray-400 dark:text-gray-500">
          <a href="/privacy" className="hover:text-gray-300 transition-colors">Privacy Policy</a>
          <span>&bull;</span>
          <a href="/terms" className="hover:text-gray-300 transition-colors">Terms of Service</a>
        </div>
      </div>
    </div>
  );
}
