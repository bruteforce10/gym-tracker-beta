import Link from "next/link";
import { Activity, Flame, Shield, Trophy } from "lucide-react";
import { getDashboardData } from "@/actions/dashboard";
import GoalSummaryCard from "@/components/goal-summary-card";
import PageHeader from "@/components/page-header";
import StatCard from "@/components/stat-card";
import WorkoutCard from "@/components/workout-card";
import { auth } from "@/lib/auth";

export default async function DashboardPage() {
  const session = await auth();
  const userName = session?.user?.name || "User";
  const isAdmin = session?.user?.role === "admin";

  const { goals, recentWorkouts, stats } = await getDashboardData();

  const today = new Intl.DateTimeFormat("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date());

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

      {goals.length > 0 ? (
        <div className="mb-6 space-y-3">
          {goals.map((goal, index) => (
            <Link
              key={goal.id}
              href="/goal"
              className="block transition-transform duration-200 hover:-translate-y-0.5"
            >
              <div style={{ animationDelay: `${400 + index * 80}ms` }}>
                <GoalSummaryCard goal={goal} />
              </div>
            </Link>
          ))}
        </div>
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
