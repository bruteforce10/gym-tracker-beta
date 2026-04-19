"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Dumbbell,
  Weight,
} from "lucide-react";

import type {
  ProgressHistoryData,
  ProgressWorkoutRecord,
} from "@/actions/progress";
import {
  addDays,
  formatDurationMinutesSeconds,
  formatDurationStopwatch,
  getMonthKey,
  getWeekStartDate,
  parseDateKey,
  toDateKey,
} from "@/lib/progress";
import WorkoutCard from "@/components/workout-card";

type ProgressHistoryViewProps = {
  data: ProgressHistoryData;
};

const monthFormatter = new Intl.DateTimeFormat("en-US", {
  month: "long",
  year: "numeric",
});
const dateLabelFormatter = new Intl.DateTimeFormat("id-ID", {
  day: "numeric",
  month: "short",
});
const timeFormatter = new Intl.DateTimeFormat("en-US", {
  hour: "2-digit",
  minute: "2-digit",
});

function formatVolume(volume: number): string {
  return new Intl.NumberFormat("id-ID", {
    maximumFractionDigits: volume % 1 === 0 ? 0 : 1,
  }).format(volume);
}

function getMonthDate(monthKey: string) {
  const [year, month] = monthKey.split("-").map(Number);
  return new Date(year, (month ?? 1) - 1, 1, 12, 0, 0, 0);
}

function getMonthGrid(monthKey: string) {
  const monthDate = getMonthDate(monthKey);
  const firstDay = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1);
  const start = getWeekStartDate(firstDay);
  const days: Array<{ date: string; inMonth: boolean }> = [];

  for (let index = 0; index < 42; index += 1) {
    const currentDate = addDays(start, index);
    days.push({
      date: toDateKey(currentDate),
      inMonth: currentDate.getMonth() === monthDate.getMonth(),
    });
  }

  return days;
}

function getWeekRangeLabel(weekStartKey: string) {
  const weekStart = parseDateKey(weekStartKey);
  const weekEnd = addDays(weekStart, 6);
  return `${dateLabelFormatter.format(weekStart)} - ${dateLabelFormatter.format(weekEnd)}`;
}

function getMonthLabel(monthKey: string) {
  return monthFormatter.format(getMonthDate(monthKey)).toUpperCase();
}

function isSameWeek(dateKey: string, weekStartKey: string) {
  return toDateKey(getWeekStartDate(parseDateKey(dateKey))) === weekStartKey;
}

function getWorkoutCardData(workout: ProgressWorkoutRecord) {
  return {
    id: workout.id,
    title: workout.title,
    date: workout.date,
    dateLabel: `${dateLabelFormatter.format(new Date(workout.date))} • ${timeFormatter.format(
      new Date(workout.startedAt),
    )}`,
    exercises: workout.exercises,
    duration: workout.endedAt
      ? formatDurationStopwatch(workout.durationSeconds)
      : "--:--",
  };
}

export default function ProgressHistoryView({
  data,
}: ProgressHistoryViewProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const initialMonth = searchParams.get("month");
  const initialDate = searchParams.get("date");
  const [selectedMonth, setSelectedMonth] = useState(
    initialMonth && data.availableMonths.includes(initialMonth)
      ? initialMonth
      : data.defaultMonthKey,
  );
  const [selectedDate, setSelectedDate] = useState<string | null>(initialDate);

  useEffect(() => {
    const monthFromUrl = searchParams.get("month");
    const dateFromUrl = searchParams.get("date");

    if (monthFromUrl && data.availableMonths.includes(monthFromUrl)) {
      setSelectedMonth(monthFromUrl);
    }

    if (dateFromUrl) {
      setSelectedDate(dateFromUrl);
    }
  }, [data.availableMonths, searchParams]);

  const workoutCountByDate = data.workouts.reduce<Record<string, number>>(
    (accumulator, workout) => {
      accumulator[workout.date] = (accumulator[workout.date] ?? 0) + 1;
      return accumulator;
    },
    {},
  );

  const monthWorkouts = data.workouts.filter(
    (workout) => workout.monthKey === selectedMonth,
  );
  const calendarDays = getMonthGrid(selectedMonth);

  useEffect(() => {
    const currentMonthWorkouts = data.workouts.filter(
      (workout) => workout.monthKey === selectedMonth,
    );
    const currentMonthCalendarDays = getMonthGrid(selectedMonth);
    const defaultDate =
      currentMonthWorkouts[0]?.date ??
      currentMonthCalendarDays.find((day) => day.inMonth)?.date ??
      null;
    setSelectedDate((currentDate) => {
      if (
        currentDate &&
        getMonthKey(parseDateKey(currentDate)) === selectedMonth
      ) {
        return currentDate;
      }

      return defaultDate;
    });
  }, [data.workouts, selectedMonth]);

  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString());
    const nextMonth = selectedMonth;
    const nextDate = selectedDate;

    if (params.get("month") !== nextMonth) {
      params.set("month", nextMonth);
    }

    if (nextDate) {
      if (params.get("date") !== nextDate) {
        params.set("date", nextDate);
      }
    } else {
      params.delete("date");
    }

    const nextQuery = params.toString();
    const currentQuery = searchParams.toString();

    if (nextQuery !== currentQuery) {
      router.replace(nextQuery ? `${pathname}?${nextQuery}` : pathname, {
        scroll: false,
      });
    }
  }, [pathname, router, searchParams, selectedDate, selectedMonth]);

  const selectedWeekKey = selectedDate
    ? toDateKey(getWeekStartDate(parseDateKey(selectedDate)))
    : toDateKey(getWeekStartDate(new Date()));
  const selectedWeekWorkouts = monthWorkouts.filter((workout) =>
    isSameWeek(workout.date, selectedWeekKey),
  );
  const selectedWeekVolume = selectedWeekWorkouts.reduce(
    (sum, workout) => sum + workout.totalVolume,
    0,
  );
  const selectedWeekDurationSeconds = selectedWeekWorkouts.reduce(
    (sum, workout) => sum + workout.durationSeconds,
    0,
  );

  const currentMonthIndex = data.availableMonths.indexOf(selectedMonth);
  const previousMonth = data.availableMonths[currentMonthIndex + 1] ?? null;
  const nextMonth =
    currentMonthIndex > 0 ? data.availableMonths[currentMonthIndex - 1] : null;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href="/progress"
          className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/8 bg-white/[0.03] text-white transition hover:bg-white/[0.08] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#10B981]/60"
          aria-label="Kembali ke progress"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        </Link>
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[#10B981]">
            History
          </p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight text-white">
            Workout History
          </h1>
        </div>
      </div>

      <section className="rounded-[32px] border border-white/6 bg-[linear-gradient(180deg,#131722_0%,#0E1118_100%)] px-5 py-5">
        <div className="flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => previousMonth && setSelectedMonth(previousMonth)}
            disabled={!previousMonth}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/8 bg-white/[0.03] text-white transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#10B981]/60 disabled:opacity-30"
            aria-label="Bulan sebelumnya"
          >
            <ChevronLeft className="h-4 w-4" aria-hidden="true" />
          </button>
          <p className="text-xl font-semibold text-white">
            {getMonthLabel(selectedMonth)}
          </p>
          <button
            type="button"
            onClick={() => nextMonth && setSelectedMonth(nextMonth)}
            disabled={!nextMonth}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/8 bg-white/[0.03] text-white transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#10B981]/60 disabled:opacity-30"
            aria-label="Bulan berikutnya"
          >
            <ChevronRight className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>

        <div className="mt-6 grid grid-cols-7 gap-2 text-center">
          {["M", "T", "W", "T", "F", "S", "S"].map((label, index) => (
            <span
              key={`${label}-${index}`}
              className="text-xs uppercase tracking-[0.18em] text-text-muted"
            >
              {label}
            </span>
          ))}
        </div>

        <div className="mt-4 grid grid-cols-7 gap-2">
          {calendarDays.map((day) => {
            const isSelected = selectedDate === day.date;
            const workoutCount = workoutCountByDate[day.date] ?? 0;

            return (
              <button
                key={day.date}
                type="button"
                onClick={() => {
                  if (!day.inMonth) {
                    const targetMonth = getMonthKey(parseDateKey(day.date));
                    if (data.availableMonths.includes(targetMonth)) {
                      setSelectedMonth(targetMonth);
                    }
                    return;
                  }

                  setSelectedDate(day.date);
                }}
                className={`relative flex aspect-square items-center justify-center rounded-full border text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#10B981]/60 ${
                  isSelected
                    ? "border-[#10B981]/40 bg-[#059669] text-white"
                    : day.inMonth
                      ? "border-white/6 bg-white/[0.04] text-white hover:bg-white/[0.08]"
                      : "border-transparent bg-transparent text-text-muted/30"
                }`}
              >
                {new Date(day.date).getDate()}
                {workoutCount > 0 ? (
                  <span className="absolute bottom-1 h-1.5 w-1.5 rounded-full bg-[#34D399]" />
                ) : null}
              </button>
            );
          })}
        </div>
      </section>

      <section className="rounded-[30px] border border-white/6 bg-[#12161F] px-5 py-5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-2xl font-semibold text-white">
              {getWeekRangeLabel(selectedWeekKey)}
            </p>
            <p className="mt-1 text-sm text-text-muted">
              Fokus ke workout dalam minggu yang sedang kamu pilih dari
              kalender.
            </p>
          </div>
          <div className="text-right">
            <p className="font-data text-3xl font-semibold text-[#34D399]">
              {selectedWeekWorkouts.length}
            </p>
            <p className="text-xs uppercase tracking-[0.14em] text-text-muted">
              Workouts
            </p>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-3 gap-3">
          <div className="rounded-[24px] bg-white/[0.03] px-4 py-4">
            <div className="flex items-center gap-2 text-text-muted">
              <Clock3 className="h-4 w-4" aria-hidden="true" />
              <span className="text-xs uppercase tracking-[0.14em]">
                Total Time
              </span>
            </div>
            <p className="mt-3 font-data text-2xl font-semibold text-white">
              {formatDurationMinutesSeconds(selectedWeekDurationSeconds)}
            </p>
          </div>
          <div className="rounded-[24px] bg-white/[0.03] px-4 py-4">
            <div className="flex items-center gap-2 text-text-muted">
              <Weight className="h-4 w-4" aria-hidden="true" />
              <span className="text-xs uppercase tracking-[0.14em]">
                Volume
              </span>
            </div>
            <p className="mt-3 font-data text-2xl font-semibold text-white">
              {formatVolume(selectedWeekVolume)}
            </p>
          </div>
          <div className="rounded-[24px] bg-white/[0.03] px-4 py-4">
            <div className="flex items-center gap-2 text-text-muted">
              <Dumbbell className="h-4 w-4" aria-hidden="true" />
              <span className="text-xs uppercase tracking-[0.14em]">
                Exercises
              </span>
            </div>
            <p className="mt-3 font-data text-2xl font-semibold text-white">
              {selectedWeekWorkouts.reduce(
                (sum, workout) => sum + workout.exerciseCount,
                0,
              )}
            </p>
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-2xl font-semibold text-white">Workout List</p>
            <p className="mt-1 text-sm text-text-muted">
              Semua detail history pindah ke halaman ini supaya halaman progress
              tetap ringkas.
            </p>
          </div>
          <CalendarDays className="h-5 w-5 text-[#10B981]" aria-hidden="true" />
        </div>

        {selectedWeekWorkouts.length > 0 ? (
          selectedWeekWorkouts.map((workout, index) => (
            <WorkoutCard
              key={workout.id}
              workout={getWorkoutCardData(workout)}
              delay={index * 80}
            />
          ))
        ) : (
          <div className="rounded-[28px] border border-dashed border-white/8 bg-white/[0.03] px-4 py-6 text-sm text-text-muted">
            Belum ada workout di minggu ini. Pilih tanggal lain di kalender
            untuk melihat history yang tersedia.
          </div>
        )}
      </section>
    </div>
  );
}
