import React, { useState, useEffect } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Zap, Mail, Lock, User, ArrowRight, Loader2 } from "lucide-react";

export function Signup() {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [deviceId, setDeviceId] = useState("");

  useEffect(() => {
    let id = localStorage.getItem("devil-ai-device-id");
    if (!id) {
      id = crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2);
      localStorage.setItem("devil-ai-device-id", id);
    }
    setDeviceId(id);
  }, []);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    
    try {
      const res = await fetch("https://devil-ai.agribee.in/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password, deviceId })
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Signup failed");
      
      localStorage.setItem("devil-ai-token", data.token);
      localStorage.setItem("devil-ai-user", JSON.stringify(data.user));
      
      // On fresh signup, redirect to plans page (settings/account)
      navigate({ to: "/settings/account" });
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
          <h2 className="mt-6 text-3xl font-bold tracking-tight text-black dark:text-white">Create an account</h2>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">Join Devil-AI and unlock your potential</p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSignup}>
          {error && (
            <div className="rounded-lg bg-red-500/10 p-4 border border-red-500/20">
              <p className="text-sm text-red-400">{error}</p>
            </div>
          )}
          
          <div className="space-y-4">
            <div>
              <label htmlFor="signup-name" className="text-sm font-medium text-gray-700 dark:text-gray-300">Full Name</label>
              <div className="relative mt-1">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <User className="h-5 w-5 text-gray-500" />
                </div>
                <input
                  id="signup-name"
                  type="text"
                  required
                  className="block w-full rounded-xl border border-black/10 dark:border-white/10 bg-white/50 dark:bg-black/50 py-3 pl-10 pr-3 text-black dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500 sm:text-sm transition-all"
                  placeholder="John Doe"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
            </div>

            <div>
              <label htmlFor="signup-email" className="text-sm font-medium text-gray-700 dark:text-gray-300">Email address</label>
              <div className="relative mt-1">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <Mail className="h-5 w-5 text-gray-500" />
                </div>
                <input
                  id="signup-email"
                  type="email"
                  required
                  className="block w-full rounded-xl border border-black/10 dark:border-white/10 bg-white/50 dark:bg-black/50 py-3 pl-10 pr-3 text-black dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500 sm:text-sm transition-all"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            <div>
              <label htmlFor="signup-password" className="text-sm font-medium text-gray-700 dark:text-gray-300">Password</label>
              <div className="relative mt-1">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <Lock className="h-5 w-5 text-gray-500" />
                </div>
                <input
                  id="signup-password"
                  type="password"
                  required
                  className="block w-full rounded-xl border border-black/10 dark:border-white/10 bg-white/50 dark:bg-black/50 py-3 pl-10 pr-3 text-black dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500 sm:text-sm transition-all"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
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
                Create Account
                <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </span>
            )}
          </button>
        </form>

        <p className="mt-8 text-center text-sm text-gray-500 dark:text-gray-400">
          Already have an account?{" "}
          <button onClick={() => navigate({ to: "/login" })} className="font-medium text-red-400 hover:text-red-300 transition-colors">
            Sign in here
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
