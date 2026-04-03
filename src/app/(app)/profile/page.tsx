"use client";

import { useSession, signOut } from "next-auth/react";
import PageHeader from "@/components/page-header";
import { getCurrentStats } from "@/actions/progress";
import { clearUserData } from "@/actions/workouts";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  User,
  Mail,
  Dumbbell,
  LogOut,
  ChevronRight,
  Moon,
  Bell,
  Shield,
  Trash2,
  AlertTriangle,
  X,
} from "lucide-react";

// ── Confirmation Dialog ──
function ConfirmResetDialog({
  onConfirm,
  onCancel,
  loading,
}: {
  onConfirm: () => void;
  onCancel: () => void;
  loading: boolean;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center px-4 pb-4 sm:pb-0">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onCancel}
      />

      {/* Dialog */}
      <div className="relative w-full max-w-md glass-card p-6 space-y-5 border border-danger/20 rounded-2xl">
        {/* Close button */}
        <button
          onClick={onCancel}
          className="absolute top-4 right-4 w-7 h-7 rounded-full bg-surface-elevated flex items-center justify-center text-text-muted hover:text-foreground transition-colors"
        >
          <X className="w-3.5 h-3.5" />
        </button>

        {/* Warning icon */}
        <div className="flex flex-col items-center text-center space-y-3 pt-2">
          <div className="w-16 h-16 rounded-full bg-danger/10 border border-danger/20 flex items-center justify-center">
            <AlertTriangle className="w-8 h-8 text-danger" />
          </div>
          <h3
            className="text-xl font-bold text-foreground"
            style={{ fontFamily: "Outfit, sans-serif" }}
          >
            Reset Semua Data?
          </h3>
          <p className="text-text-muted text-sm leading-relaxed">
            Tindakan ini akan menghapus{" "}
            <span className="text-danger font-semibold">semua data latihan</span>{" "}
            kamu secara permanen — termasuk workout history, goals, dan workout plans.
          </p>
          <p className="text-text-muted text-xs bg-surface-elevated rounded-lg px-3 py-2 w-full text-left border border-border-subtle">
            ✓ Akun & info login kamu tetap aman.
          </p>
        </div>

        {/* Actions */}
        <div className="space-y-2">
          <button
            onClick={onConfirm}
            disabled={loading}
            className="w-full h-12 rounded-xl bg-danger hover:bg-danger/80 text-white font-semibold text-sm transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2"
            id="confirm-reset-btn"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Menghapus...
              </>
            ) : (
              <>
                <Trash2 className="w-4 h-4" />
                Ya, Hapus Semua Data
              </>
            )}
          </button>
          <button
            onClick={onCancel}
            disabled={loading}
            className="w-full h-11 rounded-xl border border-border-subtle text-text-muted text-sm hover:border-emerald/30 hover:text-emerald transition-colors disabled:opacity-50"
            id="cancel-reset-btn"
          >
            Batal
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ProfilePage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [stats, setStats] = useState({ totalWorkouts: 0, totalExercises: 0 });
  const [showResetDialog, setShowResetDialog] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);

  useEffect(() => {
    getCurrentStats().then(setStats).catch(() => {});
  }, []);

  const userName = session?.user?.name || "User";
  const userEmail = session?.user?.email || "";

  const settingsItems = [
    { icon: Moon, label: "Tampilan", value: "Dark Mode", id: "setting-theme" },
    { icon: Bell, label: "Notifikasi", value: "Aktif", id: "setting-notif" },
    { icon: Shield, label: "Privasi", value: "", id: "setting-privacy" },
  ];

  const handleReset = async () => {
    setResetting(true);
    try {
      await clearUserData();
      setShowResetDialog(false);
      setResetSuccess(true);
      setStats({ totalWorkouts: 0, totalExercises: 0 });
      // Brief success state then redirect to dashboard
      setTimeout(() => {
        setResetSuccess(false);
        router.push("/dashboard");
        router.refresh();
      }, 1800);
    } catch {
      // Handle error
    } finally {
      setResetting(false);
    }
  };

  return (
    <div className="space-y-5">
      <PageHeader title="Profile" />

      {/* Reset success banner */}
      {resetSuccess && (
        <div className="glass-card p-3 border border-emerald/30 bg-emerald/5 flex items-center gap-3 animate-fade-in-up">
          <div className="w-8 h-8 rounded-full bg-emerald/20 flex items-center justify-center shrink-0">
            <span className="text-emerald text-sm">✓</span>
          </div>
          <p className="text-sm text-emerald font-medium">
            Data berhasil direset. Kembali ke dashboard...
          </p>
        </div>
      )}

      {/* Profile card */}
      <div className="glass-card p-6 animate-fade-in-up text-center" id="profile-card">
        <div className="w-20 h-20 rounded-full bg-linear-to-br from-emerald to-emerald-dark mx-auto mb-4 flex items-center justify-center glow-emerald">
          <span
            className="text-3xl font-bold text-[#0A0A0F]"
            style={{ fontFamily: "var(--font-heading)" }}
          >
            {userName.charAt(0).toUpperCase()}
          </span>
        </div>
        <h2
          className="text-xl font-bold text-foreground"
          style={{ fontFamily: "var(--font-heading)" }}
        >
          {userName}
        </h2>
        <div className="flex items-center justify-center gap-1.5 mt-1 text-text-muted">
          <Mail className="w-3 h-3" />
          <span className="text-xs">{userEmail}</span>
        </div>
      </div>

      {/* Stats */}
      <div
        className="grid grid-cols-2 gap-3 animate-fade-in-up"
        style={{ animationDelay: "100ms" }}
      >
        <div className="glass-card p-4 text-center">
          <div className="w-10 h-10 rounded-xl bg-emerald/10 flex items-center justify-center mx-auto mb-2">
            <Dumbbell className="w-5 h-5 text-emerald" />
          </div>
          <p className="font-data text-2xl font-bold text-foreground">
            {stats.totalWorkouts}
          </p>
          <p className="text-xs text-text-muted mt-0.5">Total Workout</p>
        </div>
        <div className="glass-card p-4 text-center">
          <div className="w-10 h-10 rounded-xl bg-emerald/10 flex items-center justify-center mx-auto mb-2">
            <User className="w-5 h-5 text-emerald" />
          </div>
          <p className="font-data text-2xl font-bold text-foreground">
            {stats.totalExercises}
          </p>
          <p className="text-xs text-text-muted mt-0.5">Exercise Logged</p>
        </div>
      </div>

      {/* Settings */}
      <div
        className="glass-card overflow-hidden animate-fade-in-up"
        style={{ animationDelay: "200ms" }}
        id="settings-section"
      >
        {settingsItems.map((item, i) => (
          <div key={item.id}>
            <button
              className="w-full flex items-center justify-between p-4 hover:bg-surface-hover transition-colors"
              id={item.id}
            >
              <div className="flex items-center gap-3">
                <item.icon className="w-4 h-4 text-text-muted" />
                <span className="text-sm text-foreground">{item.label}</span>
              </div>
              <div className="flex items-center gap-2">
                {item.value && (
                  <span className="text-xs text-text-muted">{item.value}</span>
                )}
                <ChevronRight className="w-4 h-4 text-text-muted/50" />
              </div>
            </button>
            {i < settingsItems.length - 1 && (
              <Separator className="bg-border-subtle" />
            )}
          </div>
        ))}
      </div>

      {/* Danger Zone */}
      <div
        className="glass-card overflow-hidden border border-danger/10 animate-fade-in-up"
        style={{ animationDelay: "300ms" }}
        id="danger-zone"
      >
        <div className="px-4 py-3 border-b border-danger/10">
          <p className="text-xs font-semibold text-danger/70 uppercase tracking-wider flex items-center gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5" />
            Danger Zone
          </p>
        </div>
        <button
          onClick={() => setShowResetDialog(true)}
          className="w-full flex items-center justify-between p-4 hover:bg-danger/5 transition-colors group"
          id="reset-data-btn"
        >
          <div className="flex items-center gap-3">
            <Trash2 className="w-4 h-4 text-danger/60 group-hover:text-danger transition-colors" />
            <div className="text-left">
              <p className="text-sm text-foreground group-hover:text-danger transition-colors">
                Reset Data Latihan
              </p>
              <p className="text-xs text-text-muted mt-0.5">
                Hapus semua workout, goals & plans
              </p>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-danger/40 group-hover:text-danger transition-colors" />
        </button>
      </div>

      {/* Logout */}
      <Button
        onClick={() => signOut({ callbackUrl: "/login" })}
        variant="outline"
        className="w-full h-12 border-danger/30 text-danger hover:bg-danger/10 rounded-xl"
        id="logout-btn"
      >
        <LogOut className="w-4 h-4 mr-2" />
        Keluar
      </Button>

      {/* Confirmation dialog */}
      {showResetDialog && (
        <ConfirmResetDialog
          onConfirm={handleReset}
          onCancel={() => setShowResetDialog(false)}
          loading={resetting}
        />
      )}
    </div>
  );
}
