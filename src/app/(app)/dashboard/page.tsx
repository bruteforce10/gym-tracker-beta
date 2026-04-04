import Link from "next/link";
import { Activity, Calendar, Flame, Trophy } from "lucide-react";
import { getDashboardData } from "@/actions/dashboard";
import PageHeader from "@/components/page-header";
import ProgressRing from "@/components/progress-ring";
import StatCard from "@/components/stat-card";
import WorkoutCard from "@/components/workout-card";
import { auth } from "@/lib/auth";
import { calculateProgress, getDaysUntilDeadline } from "@/lib/calculations";

export default async function DashboardPage() {
  const session = await auth();
  const userName = session?.user?.name || "User";

  const { goal, current1RM, recentWorkouts, stats } = await getDashboardData();

  const today = new Intl.DateTimeFormat("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date());

  const progress = goal ? calculateProgress(current1RM, goal.targetWeight) : 0;
  const daysLeft = goal?.deadline
    ? getDaysUntilDeadline(goal.deadline.toISOString())
    : null;

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

      {goal ? (
        <Link href="/goal" className="block">
          <div
            className="glass-card p-6 mb-6 animate-fade-in-up"
            style={{ animationDelay: "400ms" }}
            id="goal-progress-card"
          >
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2
                  className="text-lg font-bold text-foreground"
                  style={{ fontFamily: "var(--font-heading)" }}
                >
                  {goal.exercise?.name ?? "Exercise"}
                </h2>
                <p className="text-xs text-text-muted mt-0.5">Target Aktif</p>
              </div>
              {daysLeft !== null && (
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald/10 text-emerald">
                  <Calendar className="w-3 h-3" aria-hidden="true" />
                  <span className="text-xs font-semibold font-data">
                    {daysLeft} hari
                  </span>
                </div>
              )}
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
