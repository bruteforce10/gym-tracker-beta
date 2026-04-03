"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { registerUser } from "@/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dumbbell, Mail, Lock, Eye, EyeOff, User } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [isRegister, setIsRegister] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (isRegister) {
        // Register flow
        if (!name.trim()) {
          setError("Nama harus diisi");
          setLoading(false);
          return;
        }
        const result = await registerUser(email, password, name);
        if (result.error) {
          setError(result.error);
          setLoading(false);
          return;
        }
        // Auto login after register
        const signInResult = await signIn("credentials", {
          email,
          password,
          redirect: false,
        });
        if (signInResult?.error) {
          setError("Gagal login setelah registrasi");
          setLoading(false);
          return;
        }
        router.push("/dashboard");
      } else {
        // Login flow
        const result = await signIn("credentials", {
          email,
          password,
          redirect: false,
        });
        if (result?.error) {
          setError("Email atau password salah");
          setLoading(false);
          return;
        }
        router.push("/dashboard");
      }
    } catch {
      setError("Terjadi kesalahan. Coba lagi.");
      setLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    signIn("google", { callbackUrl: "/dashboard" });
  };

  return (
    <div className="min-h-screen gradient-mesh flex flex-col items-center justify-center px-6">
      {/* Logo + Branding */}
      <div
        className="text-center mb-10 animate-fade-in-up"
        style={{ animationDelay: "100ms" }}
      >
        <div className="w-20 h-20 rounded-2xl bg-linear-to-br from-emerald to-emerald-dark mx-auto mb-5 flex items-center justify-center glow-emerald rotate-3 hover:rotate-0 transition-transform duration-500">
          <Dumbbell className="w-10 h-10 text-[#0A0A0F]" />
        </div>
        <h1
          className="text-4xl font-black text-foreground tracking-tight"
          style={{ fontFamily: "var(--font-heading)" }}
        >
          Gym<span className="text-emerald">Forge</span>
        </h1>
        <p className="text-sm text-text-muted mt-2">
          Lacak progres. Capai target. Jadi lebih kuat.
        </p>
      </div>

      {/* Login/Register Form */}
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm space-y-4 animate-fade-in-up"
        style={{ animationDelay: "300ms" }}
        id="login-form"
      >
        <div className="glass-card p-6 space-y-4">
          <h2
            className="text-lg font-bold text-foreground text-center"
            style={{ fontFamily: "var(--font-heading)" }}
          >
            {isRegister ? "Buat Akun" : "Masuk"}
          </h2>

          {/* Name (register only) */}
          {isRegister && (
            <div>
              <label className="text-xs text-text-muted font-medium mb-1.5 block">
                Nama
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                <Input
                  type="text"
                  placeholder="Nama lengkap"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="pl-10 bg-surface-elevated border-border-subtle text-foreground"
                  id="name-input"
                />
              </div>
            </div>
          )}

          {/* Email */}
          <div>
            <label className="text-xs text-text-muted font-medium mb-1.5 block">
              Email
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
              <Input
                type="email"
                placeholder="email@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="pl-10 bg-surface-elevated border-border-subtle text-foreground"
                id="email-input"
                required
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <label className="text-xs text-text-muted font-medium mb-1.5 block">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
              <Input
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pl-10 pr-10 bg-surface-elevated border-border-subtle text-foreground"
                id="password-input"
                required
                minLength={6}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-foreground transition-colors"
              >
                {showPassword ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>

          {/* Error message */}
          {error && (
            <p className="text-xs text-danger text-center">{error}</p>
          )}

          {/* Submit Button */}
          <Button
            type="submit"
            disabled={loading}
            className="w-full h-12 bg-emerald hover:bg-emerald-dark text-[#0A0A0F] font-semibold text-base rounded-xl transition-all active:scale-[0.98] disabled:opacity-50"
            id="login-btn"
          >
            {loading ? "Loading..." : isRegister ? "Daftar" : "Masuk"}
          </Button>
        </div>

        {/* Divider */}
        <div className="flex items-center gap-3">
          <div className="flex-1 h-px bg-border-subtle" />
          <span className="text-xs text-text-muted">atau</span>
          <div className="flex-1 h-px bg-border-subtle" />
        </div>

        {/* Google Login */}
        <button
          type="button"
          onClick={handleGoogleLogin}
          className="w-full h-12 glass-card flex items-center justify-center gap-3 text-sm font-medium text-foreground hover:border-emerald/30 transition-all active:scale-[0.98]"
          id="google-login-btn"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
              fill="#4285F4"
            />
            <path
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              fill="#34A853"
            />
            <path
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              fill="#FBBC05"
            />
            <path
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              fill="#EA4335"
            />
          </svg>
          Masuk dengan Google
        </button>

        {/* Toggle register/login */}
        <p className="text-center text-xs text-text-muted">
          {isRegister ? "Sudah punya akun?" : "Belum punya akun?"}{" "}
          <button
            type="button"
            onClick={() => {
              setIsRegister(!isRegister);
              setError("");
            }}
            className="text-emerald font-medium hover:underline"
          >
            {isRegister ? "Masuk" : "Daftar"}
          </button>
        </p>
      </form>
    </div>
  );
}
