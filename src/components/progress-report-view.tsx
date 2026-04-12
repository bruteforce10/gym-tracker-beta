"use client";

import Link from "next/link";
import { useState } from "react";
import {
  ArrowUpRight,
  CalendarDays,
  ChevronRight,
  Dumbbell,
  Flame,
  Info,
  TrendingUp,
} from "lucide-react";

import type { ProgressDashboardData, ProgressWorkoutRecord } from "@/actions/progress";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import WeightLogSheet from "@/components/weight-log-sheet";
import { formatDurationClock } from "@/lib/progress";

type ProgressReportViewProps = {
  data: ProgressDashboardData;
};

const dateLabelFormatter = new Intl.DateTimeFormat("id-ID", {
  day: "numeric",
  month: "short",
});

function formatVolume(volume: number): string {
  return new Intl.NumberFormat("id-ID", {
    maximumFractionDigits: volume % 1 === 0 ? 0 : 1,
  }).format(volume);
}

function formatWeight(weight: number): string {
  return new Intl.NumberFormat("id-ID", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(weight);
}

function getWorkoutDateLabel(date: string): string {
  return dateLabelFormatter.format(new Date(date));
}

type ChartPoint = {
  x: number;
  y: number;
};

type ChartBounds = {
  min: number;
  max: number;
};

function formatAxisWeight(weight: number): string {
  return new Intl.NumberFormat("id-ID", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 1,
  }).format(weight);
}

function getWeightBounds(values: number[]): ChartBounds {
  const minValue = Math.min(...values);
  const maxValue = Math.max(...values);

  if (minValue === maxValue) {
    return {
      min: Math.max(0, minValue - 1),
      max: maxValue + 1,
    };
  }

  const padding = Math.max(0.4, (maxValue - minValue) * 0.2);
  return {
    min: Math.max(0, Math.floor((minValue - padding) * 10) / 10),
    max: Math.ceil((maxValue + padding) * 10) / 10,
  };
}

function getYCoordinate(
  value: number,
  chartHeight: number,
  bounds: ChartBounds,
) {
  const range = Math.max(bounds.max - bounds.min, 0.1);
  return chartHeight - ((value - bounds.min) / range) * chartHeight;
}

function getChartPoints(
  values: number[],
  chartWidth: number,
  chartHeight: number,
  bounds: ChartBounds,
): ChartPoint[] {
  if (values.length === 1) {
    return [
      {
        x: chartWidth / 2,
        y: getYCoordinate(values[0], chartHeight, bounds),
      },
    ];
  }

  return values.map((value, index) => ({
    x: (index / (values.length - 1)) * chartWidth,
    y: getYCoordinate(value, chartHeight, bounds),
  }));
}

function getChartPath(points: ChartPoint[]) {
  if (points.length === 0) return "";

  return points
    .map((point, index) => {
      return `${index === 0 ? "M" : "L"}${point.x.toFixed(2)},${point.y.toFixed(2)}`;
    })
    .join(" ");
}

function getAreaPath(points: ChartPoint[], chartWidth: number, chartHeight: number) {
  const linePath = getChartPath(points);
  if (!linePath) return "";
  return `${linePath} L ${chartWidth},${chartHeight} L 0,${chartHeight} Z`;
}

function getTickValues(bounds: ChartBounds, count = 4) {
  const range = bounds.max - bounds.min;
  const step = range / count;

  return Array.from({ length: count + 1 }, (_, index) =>
    Number((bounds.max - step * index).toFixed(1))
  );
}

function getXAxisTickIndices(totalPoints: number, maxTicks = 5) {
  if (totalPoints <= maxTicks) {
    return Array.from({ length: totalPoints }, (_, index) => index);
  }

  const step = Math.ceil((totalPoints - 1) / (maxTicks - 1));
  const indices = new Set<number>();

  for (let index = 0; index < totalPoints; index += step) {
    indices.add(index);
  }

  indices.add(totalPoints - 1);

  return Array.from(indices).sort((left, right) => left - right);
}

function FrequencyChart({
  data,
}: {
  data: ProgressDashboardData["frequency"];
}) {
  const max = Math.max(...data.map((item) => item.workouts), 1);

  return (
    <div className="mt-4">
      <div className="grid h-40 grid-cols-8 items-end gap-3">
        {data.map((item) => (
          <div key={item.weekStart} className="flex h-full flex-col justify-end">
            <div className="relative flex flex-1 items-end justify-center">
              <div className="absolute inset-x-0 bottom-0 top-0 rounded-full bg-white/[0.03]" />
              <div
                className="relative w-6 rounded-full bg-[linear-gradient(180deg,#34D399_0%,#059669_100%)] shadow-[0_10px_30px_rgba(16,185,129,0.35)]"
                style={{
                  height: `${Math.max(14, (item.workouts / max) * 100)}%`,
                }}
              />
            </div>
            <div className="mt-3 text-center">
              <p className="font-data text-sm font-semibold text-white">
                {item.workouts}
              </p>
              <p className="mt-1 text-[10px] uppercase tracking-[0.14em] text-text-muted">
                {item.label}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function WeightTrend({
  points,
}: {
  points: ProgressDashboardData["weight"]["points"];
}) {
  const [selectedIndex, setSelectedIndex] = useState(
    points.length > 0 ? points.length - 1 : 0
  );

  if (points.length === 0) {
    return (
      <div className="mt-6 flex h-40 items-center justify-center rounded-[28px] border border-dashed border-white/8 bg-black/20 px-4 text-center text-sm text-text-muted">
        Belum ada log berat badan. Simpan log pertama kamu untuk melihat tren 30 hari.
      </div>
    );
  }

  const svgWidth = 360;
  const svgHeight = 244;
  const margin = { top: 42, right: 14, bottom: 34, left: 50 };
  const chartWidth = svgWidth - margin.left - margin.right;
  const chartHeight = svgHeight - margin.top - margin.bottom;
  const values = points.map((point) => point.valueKg);
  const bounds = getWeightBounds(values);
  const chartPoints = getChartPoints(values, chartWidth, chartHeight, bounds);
  const linePath = getChartPath(chartPoints);
  const areaPath = getAreaPath(chartPoints, chartWidth, chartHeight);
  const yTicks = getTickValues(bounds);
  const xTickIndices = getXAxisTickIndices(points.length);
  const activeIndex = Math.min(selectedIndex, points.length - 1);
  const activePoint = points[activeIndex];
  const activeCoordinates = chartPoints[activeIndex];

  return (
    <div className="mt-6 overflow-hidden rounded-[28px] border border-white/6 bg-[linear-gradient(180deg,rgba(16,185,129,0.16),rgba(17,19,26,0.25))] px-4 py-5">
      <div className="flex items-end justify-between text-[11px] uppercase tracking-[0.16em] text-text-muted">
        <span>Last 30 Days</span>
        <span>{points.length} log</span>
      </div>
      <div className="mt-5 rounded-[24px] border border-white/5 bg-black/10 px-2 py-3">
        <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="h-60 w-full overflow-visible">
          <defs>
            <linearGradient id="weight-area-gradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="rgba(16,185,129,0.45)" />
              <stop offset="100%" stopColor="rgba(16,185,129,0.02)" />
            </linearGradient>
          </defs>
          <g transform={`translate(${margin.left}, ${margin.top})`}>
            {yTicks.map((tickValue) => {
              const y = getYCoordinate(tickValue, chartHeight, bounds);

              return (
                <g key={tickValue}>
                  <line
                    x1={0}
                    y1={y}
                    x2={chartWidth}
                    y2={y}
                    stroke="rgba(255,255,255,0.08)"
                    strokeWidth="1"
                  />
                  <text
                    x={-12}
                    y={y + 4}
                    fill="rgba(203,210,227,0.78)"
                    textAnchor="end"
                    fontSize="11"
                    fontWeight="500"
                  >
                    {formatAxisWeight(tickValue)}
                  </text>
                </g>
              );
            })}

            {activeCoordinates ? (
              <>
                <line
                  x1={0}
                  y1={activeCoordinates.y}
                  x2={activeCoordinates.x}
                  y2={activeCoordinates.y}
                  stroke="rgba(52,211,153,0.5)"
                  strokeWidth="1.5"
                  strokeDasharray="6 8"
                />
                <line
                  x1={activeCoordinates.x}
                  y1={activeCoordinates.y}
                  x2={activeCoordinates.x}
                  y2={chartHeight}
                  stroke="rgba(16,185,129,0.16)"
                  strokeWidth="1"
                />
              </>
            ) : null}

            <path d={areaPath} fill="url(#weight-area-gradient)" />
            <path
              d={linePath}
              fill="none"
              stroke="#10B981"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {points.map((point, index) => {
              const coordinates = chartPoints[index];
              const isActive = index === activeIndex;

              return (
                <g
                  key={point.date}
                  role="button"
                  tabIndex={0}
                  aria-label={`${getWorkoutDateLabel(point.date)} ${formatWeight(point.valueKg)} kilogram`}
                  onClick={() => setSelectedIndex(index)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      setSelectedIndex(index);
                    }
                  }}
                  className="cursor-pointer focus:outline-none"
                >
                  <circle
                    cx={coordinates.x}
                    cy={coordinates.y}
                    r={14}
                    fill="transparent"
                  />
                  {isActive ? (
                    <>
                      <path
                        d={`M ${coordinates.x - 10},${coordinates.y - 37} h 20 a 11 11 0 0 1 11 11 v 0 a 11 11 0 0 1 -11 11 h -5 l -4 7 l -4 -7 h -7 a 11 11 0 0 1 -11 -11 v 0 a 11 11 0 0 1 11 -11 z`}
                        fill="#10B981"
                      />
                      <text
                        x={coordinates.x}
                        y={coordinates.y - 21}
                        fill="white"
                        textAnchor="middle"
                        fontSize="11"
                        fontWeight="700"
                      >
                        {formatWeight(point.valueKg)}
                      </text>
                    </>
                  ) : null}
                  <circle
                    cx={coordinates.x}
                    cy={coordinates.y}
                    r={isActive ? 7.5 : 4.5}
                    fill="#10141C"
                    stroke="#10B981"
                    strokeWidth={isActive ? 4 : 2.5}
                  />
                  {isActive ? (
                    <circle
                      cx={coordinates.x}
                      cy={coordinates.y}
                      r={2.2}
                      fill="#A7F3D0"
                    />
                  ) : null}
                </g>
              );
            })}

            {xTickIndices.map((index) => {
              const coordinates = chartPoints[index];

              return (
                <text
                  key={`${points[index].date}-axis`}
                  x={coordinates.x}
                  y={chartHeight + 22}
                  fill="rgba(203,210,227,0.72)"
                  textAnchor="middle"
                  fontSize="11"
                  fontWeight="500"
                >
                  {getWorkoutDateLabel(points[index].date)}
                </text>
              );
            })}
          </g>
        </svg>
      </div>
      <div className="mt-3 flex items-center justify-between text-xs text-text-muted">
        <span>
          Dipilih: {getWorkoutDateLabel(activePoint.date)}
        </span>
        <span>{formatWeight(activePoint.valueKg)} kg</span>
      </div>
    </div>
  );
}

function WorkoutPreviewCard({
  workout,
}: {
  workout: ProgressWorkoutRecord;
}) {
  const topExercise = workout.exercises[0];

  return (
    <div className="rounded-[26px] border border-white/6 bg-[#1B1F29] px-4 py-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-lg font-semibold text-white">{workout.title}</p>
          <p className="mt-1 text-sm text-text-muted">
            {topExercise
              ? `${topExercise.exercise} • ${workout.exerciseCount} exercise`
              : "Workout selesai"}
          </p>
        </div>
        <span className="text-sm text-text-muted">{getWorkoutDateLabel(workout.date)}</span>
      </div>

        <div className="mt-4 grid grid-cols-3 gap-3 text-left">
          <div className="border-r border-white/6 pr-3">
            <p className="font-data text-lg font-semibold text-white">
              {workout.endedAt ? formatDurationClock(workout.durationMinutes) : "--:--"}
            </p>
            <p className="text-xs text-text-muted">Duration</p>
          </div>
        <div className="border-r border-white/6 px-3">
          <p className="font-data text-lg font-semibold text-white">
            {formatVolume(workout.totalVolume)}
          </p>
          <p className="text-xs text-text-muted">Volume</p>
        </div>
        <div className="pl-3">
          <p className="font-data text-lg font-semibold text-white">
            {workout.exerciseCount}
          </p>
          <p className="text-xs text-text-muted">Exercises</p>
        </div>
      </div>
    </div>
  );
}

export default function ProgressReportView({ data }: ProgressReportViewProps) {
  const [weightSheetOpen, setWeightSheetOpen] = useState(false);

  return (
    <>
      <div className="space-y-6">
        <section className="rounded-[32px] border border-white/6 bg-[linear-gradient(180deg,#12151E_0%,#0D1017_100%)] px-5 py-5 shadow-[0_24px_60px_rgba(0,0,0,0.28)]">
          <p className="text-xs font-semibold uppercase tracking-[0.32em] text-emerald">
            Report
          </p>
          <div className="mt-3 flex items-start justify-between gap-4">
            <div>
              <h1 className="text-[2rem] font-semibold tracking-tight text-white">
                Progress
              </h1>
              <p className="mt-1 max-w-[16rem] text-sm leading-6 text-text-muted">
                Glanceable report untuk lihat ritme latihan, durasi sesi, dan
                perkembangan volume.
              </p>
            </div>
            <Link
              href="/progress/history"
              className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/8 bg-white/[0.03] text-white transition hover:bg-white/[0.08] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald/60"
              aria-label="Buka history progress"
            >
              <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>

          <div className="mt-6 grid grid-cols-3 gap-3">
            <div className="rounded-[24px] bg-white/[0.03] px-3 py-4">
              <p className="text-xs uppercase tracking-[0.14em] text-text-muted">
                Workouts
              </p>
              <p className="mt-3 font-data text-[2rem] font-semibold text-emerald">
                {data.totals.totalWorkouts}
              </p>
            </div>
            <div className="rounded-[24px] bg-white/[0.03] px-3 py-4">
              <p className="text-xs uppercase tracking-[0.14em] text-text-muted">
                Time(min)
              </p>
              <p className="mt-3 font-data text-[2rem] font-semibold text-emerald">
                {data.totals.totalMinutes}
              </p>
            </div>
            <div className="rounded-[24px] bg-white/[0.03] px-3 py-4">
              <p className="text-xs uppercase tracking-[0.14em] text-text-muted">
                Volume(kg)
              </p>
              <p className="mt-3 font-data text-[2rem] font-semibold text-emerald">
                {formatVolume(data.totals.totalVolume)}
              </p>
            </div>
          </div>

          <Link
            href="/progress/history"
            className="mt-5 block rounded-[28px] border border-white/6 bg-[#222733] px-4 py-4 transition hover:border-emerald/40 hover:bg-[#252B39] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald/60"
          >
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-white">
                  Workout times per week
                </p>
                <p className="mt-1 text-xs text-text-muted">
                  Tekan grafik untuk buka history lengkap dan kalender bulanan.
                </p>
              </div>
              <ChevronRight className="h-4 w-4 text-text-muted" aria-hidden="true" />
            </div>
            <FrequencyChart data={data.frequency} />
          </Link>
        </section>

        <Link
          href="/progress/history"
          className="block rounded-[30px] border border-white/6 bg-[linear-gradient(180deg,#131722_0%,#0D1118_100%)] px-5 py-5 transition hover:border-emerald/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald/60"
        >
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-2xl font-semibold text-white">This Week</p>
              <p className="mt-1 text-sm text-text-muted">
                Tekan section ini untuk lihat semua workout mingguan di history.
              </p>
            </div>
            <CalendarDays className="h-5 w-5 text-emerald" aria-hidden="true" />
          </div>

          <div className="mt-5 flex items-center justify-between gap-2">
            {data.thisWeek.days.map((day) => {
              const isActive = day.workouts > 0 || day.isToday;

              return (
                <div key={day.date} className="flex flex-1 flex-col items-center gap-2">
                  <span className="text-xs uppercase tracking-[0.14em] text-text-muted">
                    {day.shortLabel}
                  </span>
                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-full border text-sm font-semibold ${
                      isActive
                        ? "border-emerald/40 bg-emerald/30 text-white"
                        : "border-white/6 bg-white/[0.04] text-text-muted"
                    }`}
                  >
                    {new Date(day.date).getDate()}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-5 grid grid-cols-2 gap-4 rounded-[24px] border border-white/6 bg-black/20 px-4 py-4">
            <div className="border-r border-white/6 pr-4">
              <p className="text-xs uppercase tracking-[0.14em] text-text-muted">
                Today(min)
              </p>
              <p className="mt-2 font-data text-[2rem] font-semibold text-emerald">
                {data.thisWeek.todayMinutes}
              </p>
            </div>
            <div className="pl-1">
              <p className="text-xs uppercase tracking-[0.14em] text-text-muted">
                Weekly average(min)
              </p>
              <p className="mt-2 font-data text-[2rem] font-semibold text-emerald">
                {data.thisWeek.averageMinutes}
              </p>
            </div>
          </div>
        </Link>

        <section className="rounded-[30px] border border-white/6 bg-[#10141C] px-5 py-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <p className="text-xl font-semibold text-white">Ringkasan Mingguan</p>
                <Popover>
                  <PopoverTrigger
                    aria-label="Info delta mingguan"
                    className="inline-flex h-5 w-5 items-center justify-center rounded-full border border-white/12 text-text-muted transition hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald/60"
                  >
                    <Info className="h-3.5 w-3.5" aria-hidden="true" />
                  </PopoverTrigger>
                  <PopoverContent
                    side="top"
                    align="start"
                    sideOffset={8}
                    className="max-w-[500px] rounded-xl border border-white/10 bg-black p-3 text-left text-[11px] leading-5 text-text-muted"
                  >
                    Delta = perubahan Peak 1RM. Dibandingkan minggu lalu; jika belum ada data minggu lalu, dibandingkan dari set awal minggu ini.
                  </PopoverContent>
                </Popover>
              </div>
              <p className="mt-1 text-sm text-text-muted">
                Tetap tampil di halaman ini buat baca progres paling cepat.
              </p>
            </div>
            <TrendingUp className="h-5 w-5 text-emerald" aria-hidden="true" />
          </div>

          <div className="mt-5 space-y-3">
            {data.weeklySummary.length > 0 ? (
              data.weeklySummary.map((summary) => (
                <div
                  key={summary.exerciseId}
                  className="flex items-center justify-between rounded-[22px] border border-white/6 bg-white/[0.03] px-4 py-3"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald/10">
                      <Dumbbell className="h-4 w-4 text-emerald" aria-hidden="true" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-white">
                        {summary.exercise}
                      </p>
                      <p className="text-xs text-text-muted">
                        Peak 1RM {summary.peak1RM.toFixed(1)} kg
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p
                      className={`font-data text-lg font-semibold ${
                        summary.delta >= 0 ? "text-emerald" : "text-danger"
                      }`}
                    >
                      {summary.delta > 0 ? "+" : ""}
                      {summary.delta.toFixed(1)}
                    </p>
                    <p className="text-[11px] uppercase tracking-[0.14em] text-text-muted">
                      Delta
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <div className="rounded-[24px] border border-dashed border-white/8 bg-white/[0.03] px-4 py-5 text-sm text-text-muted">
                Belum ada latihan minggu ini. Mulai workout baru untuk melihat perubahan 1RM di sini.
              </div>
            )}
          </div>
        </section>

        <section className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-2xl font-semibold text-white">History</p>
              <p className="mt-1 text-sm text-text-muted">
                Preview singkat, detail lengkapnya pindah ke halaman history.
              </p>
            </div>
            <Link
              href="/progress/history"
              className="text-sm font-medium text-emerald transition hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald/60"
            >
              View All
            </Link>
          </div>

          {data.historyPreview.length > 0 ? (
            data.historyPreview.map((workout) => (
              <WorkoutPreviewCard key={workout.id} workout={workout} />
            ))
          ) : (
            <div className="rounded-[28px] border border-dashed border-white/8 bg-white/[0.03] px-4 py-6 text-sm text-text-muted">
              Belum ada history workout. Setelah sesi pertama selesai, preview workout bakal muncul di sini.
            </div>
          )}
        </section>

        <section className="rounded-[32px] border border-white/6 bg-[linear-gradient(180deg,#131722_0%,#0E1118_100%)] px-5 py-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-2xl font-semibold text-white">My Weight</p>
              <p className="mt-1 text-sm text-text-muted">
                Pantau berat badan kamu berdampingan dengan progres latihan.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setWeightSheetOpen(true)}
              className="inline-flex items-center justify-center rounded-full bg-emerald px-5 py-3 text-sm font-semibold text-[#0A0A0F] transition hover:bg-emerald-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald/60"
            >
              Log
            </button>
          </div>

          <div className="mt-6 flex items-end justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.14em] text-text-muted">
                Current(kg)
              </p>
              <p className="mt-2 font-data text-[3rem] font-semibold leading-none text-emerald">
                {data.weight.currentKg ? formatWeight(data.weight.currentKg) : "--"}
              </p>
              <div className="mt-3 flex items-center gap-2 text-sm text-text-muted">
                <Flame className="h-4 w-4 text-emerald" aria-hidden="true" />
                <span>
                  {data.weight.changeKg !== null
                    ? `${data.weight.changeKg > 0 ? "+" : ""}${formatWeight(
                        data.weight.changeKg,
                      )} kg vs 30 hari`
                    : "Belum cukup data perubahan 30 hari"}
                </span>
              </div>
            </div>
            <div className="rounded-[24px] border border-white/6 bg-white/[0.03] px-4 py-3 text-right">
              <p className="text-xs uppercase tracking-[0.14em] text-text-muted">
                Updated
              </p>
              <p className="mt-2 text-sm font-semibold text-white">
                {data.weight.latestLoggedOn
                  ? getWorkoutDateLabel(data.weight.latestLoggedOn)
                  : "Belum ada log"}
              </p>
            </div>
          </div>

          <WeightTrend points={data.weight.points} />
        </section>
      </div>

      <WeightLogSheet
        open={weightSheetOpen}
        onOpenChange={setWeightSheetOpen}
        currentKg={data.weight.currentKg}
        latestLoggedOn={data.weight.latestLoggedOn}
      />
    </>
  );
}
