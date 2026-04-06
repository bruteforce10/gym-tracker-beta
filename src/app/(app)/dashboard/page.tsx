import Link from "next/link";
import {
  Activity,
  AlertTriangle,
  Calendar,
  Flame,
  Shield,
  Trophy,
} from "lucide-react";
import { getDashboardData } from "@/actions/dashboard";
import PageHeader from "@/components/page-header";
import ProgressRing from "@/components/progress-ring";
import StatCard from "@/components/stat-card";
import WorkoutCard from "@/components/workout-card";
import { auth } from "@/lib/auth";
import { calculateProgress, getDaysUntilDeadline } from "@/lib/calculations";
import { formatDateInputValue } from "@/lib/date";

export default async function DashboardPage() {
  const session = await auth();
  const userName = session?.user?.name || "User";
  const isAdmin = session?.user?.role === "admin";

  const { goal, current1RM, recentWorkouts, stats } = await getDashboardData();

  const today = new Intl.DateTimeFormat("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date());

  const progress = goal ? calculateProgress(current1RM, goal.targetWeight) : 0;
  const daysLeft = goal?.deadline
    ? getDaysUntilDeadline(formatDateInputValue(goal.deadline))
    : null;
  const isDeadlineWarning = daysLeft !== null && daysLeft <= 3;
  const deadlineLabel =
    daysLeft === null
      ? null
      : daysLeft < 0
        ? `Lewat ${Math.abs(daysLeft)} hari`
        : daysLeft === 0
          ? "Hari Ini"
          : `${daysLeft} hari`;

  return (
    <div>
      <PageHeader title={`Halo, ${userName} 👋`} subtitle={today} />

      <div className="grid grid-cols-3 gap-3 mb-6">
        <StatCard
          icon={<Activity className="w-4 h-4" />}
          label="Workouts"
          value={stats.totalWorkouts}
          delay={100}
        />
        <StatCard
          icon={<Flame className="w-4 h-4" />}
          label="Streak"
          value={stats.streak}
          suffix="hari"
          delay={200}
        />
        <StatCard
          icon={<Trophy className="w-4 h-4" />}
          label="Best 1RM"
          value={stats.best1RM.toFixed(1)}
          suffix="kg"
          delay={300}
        />
      </div>

      {isAdmin ? (
        <Link href="/admin/exercises" className="mb-6 block">
          <div className="glass-card flex items-center gap-4 border border-emerald/20 p-4 transition-colors hover:border-emerald/40">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald/10 text-emerald">
              <Shield className="h-5 w-5" aria-hidden="true" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-foreground">
                Dashboard Custom Exercise
              </p>
              <p className="mt-0.5 text-xs text-text-muted">
                Pantau submission user, edit datanya, dan promote ke semua user.
              </p>
            </div>
          </div>
        </Link>
      ) : null}

      {goal ? (
        <Link href="/goal" className="block">
          <div
            className="glass-card p-6 mb-6 animate-fade-in-up"
            style={{ animationDelay: "400ms" }}
            id="goal-progress-card"
          >
            <div className="mb-4 space-y-2">
              <div className="flex flex-wrap justify-between full items-center gap-2">
                <h2
                  className="min-w-0 text-balance text-lg font-bold text-foreground"
                  style={{ fontFamily: "var(--font-heading)" }}
                >
                  {goal.exercise?.name ?? "Exercise"}
                </h2>
                {deadlineLabel ? (
                  <div
                    className={`inline-flex min-h-9 items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold ${
                      isDeadlineWarning
                        ? "bg-red-danger/12 text-danger"
                        : "border-emerald/20 bg-emerald/10 text-emerald"
                    }`}
                  >
                    {isDeadlineWarning ? (
                      <AlertTriangle
                        className="h-3.5 w-3.5 shrink-0"
                        aria-hidden="true"
                      />
                    ) : (
                      <Calendar
                        className="h-3.5 w-3.5 shrink-0"
                        aria-hidden="true"
                      />
                    )}
                    <span className="font-data">{deadlineLabel}</span>
                  </div>
                ) : null}
              </div>
              <p className="text-xs text-text-muted mt-0.5">Target Aktif</p>
            </div>
            <div className="flex items-center gap-6">
              <ProgressRing
                percentage={progress}
                size={130}
                strokeWidth={8}
                label="progress"
              />
              <div className="flex-1 space-y-3">
                <div className="glass-card p-3">
                  <p className="text-[10px] text-text-muted uppercase tracking-wider mb-0.5">
                    1RM Saat Ini
                  </p>
                  <p className="font-data text-xl font-bold text-foreground">
                    {current1RM.toFixed(1)}{" "}
                    <span className="text-sm text-text-muted font-normal">
                      kg
                    </span>
                  </p>
                </div>
                <div className="glass-card p-3">
                  <p className="text-[10px] text-text-muted uppercase tracking-wider mb-0.5">
                    Target
                  </p>
                  <p className="font-data text-xl font-bold text-emerald">
                    {goal.targetWeight}{" "}
                    <span className="text-sm text-text-muted font-normal">
                      kg
                    </span>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </Link>
      ) : (
        <Link href="/goal" className="block">
          <div className="glass-card p-6 mb-6 text-center animate-fade-in-up">
            <p className="text-2xl mb-2">🎯</p>
            <p className="text-sm text-text-muted">
              Belum ada target. Tap untuk membuat goal pertamamu!
            </p>
          </div>
        </Link>
      )}

      <div className="animate-fade-in-up" style={{ animationDelay: "500ms" }}>
        <div className="flex items-center justify-between mb-3">
          <h2
            className="text-base font-bold text-foreground"
            style={{ fontFamily: "var(--font-heading)" }}
          >
            Latihan Terakhir
          </h2>
          <Link
            href="/progress"
            className="text-xs text-emerald font-medium hover:underline"
          >
            Lihat semua
          </Link>
        </div>
        {recentWorkouts.length > 0 ? (
          <div className="space-y-3">
            {recentWorkouts.map((workout, index) => (
              <WorkoutCard
                key={workout.id}
                workout={workout}
                delay={600 + index * 100}
              />
            ))}
          </div>
        ) : (
          <div className="glass-card p-8 text-center">
            <p className="text-2xl mb-2">💪</p>
            <p className="text-sm text-text-muted">
              Belum ada latihan. Tap tombol &quot;+&quot; untuk mulai!
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
