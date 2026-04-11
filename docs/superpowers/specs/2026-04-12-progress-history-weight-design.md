# Progress, History, and Weight Tracking Design

## Goal

Redesign the existing `Progress` experience into a dashboard-style report page inspired by the provided mobile references, while moving detailed workout history into a dedicated `History` page and introducing persistent body-weight tracking.

## User Experience

### Progress page

The `Progress` tab remains a mixed dashboard page rather than becoming history-only. It should include:

- A bold `Report`-style hero section with infographic cards for total workouts, total duration, and total volume.
- A weekly workout-frequency chart that acts as a navigation affordance into the dedicated history page.
- A compact `This Week` section that also links to history.
- A still-visible `Ringkasan Mingguan` section, restyled to fit the new layout.
- A `History` preview section showing the most recent workouts with a `View all` action.
- A `My Weight` card showing the latest logged weight, a 30-day mini-chart, and a `Log` action.

### History page

Introduce a dedicated history page for detailed progress exploration. It should include:

- A monthly calendar overview.
- A selected week or date-range summary.
- Detailed workout history cards with date/time, duration, and volume.
- Query-param driven entry from `Progress` interactions such as weekly chart and `This Week`.

### Weight logging

Introduce a `My Weight` workflow inspired by the supplied references:

- A persistent body-weight log model stored in the database.
- A bottom sheet triggered from `My Weight > Log`.
- One entry per user per day: saving on the same day updates that day’s entry instead of creating duplicates.
- Support logging in kilograms, with optional pounds input in the UI converted to kilograms on save.

## Data Model

### Workout

Use the already-added timing fields:

- `startedAt`
- `endedAt`

History and report cards should derive duration from these timestamps.

### WeightLog

Add a new Prisma model:

- `id`
- `userId`
- `valueKg`
- `loggedAt`
- `createdAt`
- `updatedAt`

`loggedAt` represents the effective day of the weight measurement and drives charts, latest value, and calendar/time grouping.

## Server Data Flow

### Progress dashboard action

Create an aggregated action that returns:

- top-level report metrics
- weekly frequency chart data
- current-week summary values
- recent workout previews
- weekly strength summary
- latest weight log
- 30-day weight series

### History action

Create a dedicated history action that returns:

- all workouts for the signed-in user
- monthly calendar metadata
- grouped entries for the active week/date range
- per-workout duration and volume

### Weight actions

Add actions to:

- fetch dashboard-ready weight data
- upsert today/date-specific weight logs

## UI Architecture

Introduce or update these surfaces:

- `src/app/(app)/progress/page.tsx`
- `src/app/(app)/progress/history/page.tsx`
- weight logging sheet component
- report/history card components as needed

Avoid overloading the current `WorkoutCard` if the new report/history presentation is materially different; create focused components instead.

## Interaction Rules

- Clicking the weekly chart navigates to history.
- Clicking `This Week` navigates to history.
- Clicking `View all` in history preview navigates to history.
- Logging body weight refreshes the `Progress` dashboard state immediately.
- If no weight logs exist, show a friendly empty state and keep the `Log` CTA prominent.

## Visual Direction

Follow the reference images with a polished dark, compact, app-native report aesthetic:

- data-forward dashboard composition
- rounded dark panels
- electric blue chart accents for report visuals
- clear contrast between informational modules
- bottom-sheet interactions for fast logging flows

Preserve the app’s existing dark shell and mobile-first structure while making the progress surfaces feel more editorial and intentionally designed.

## Edge Cases

- No workouts: show report empty state without breaking layout.
- No weight logs: show empty chart scaffold and `Log` CTA.
- Same-day weight re-entry: update existing entry.
- Missing `endedAt` on older workouts: duration should degrade gracefully.

## Validation

- Prisma schema sync and client generation must succeed.
- `npm run build` must pass.
- New routes should work from mobile navigation context without breaking the active tab affordance for `Progress`.
