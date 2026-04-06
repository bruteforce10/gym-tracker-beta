# Multi Goal Management Design

## Summary

The app should support up to three active goals per user instead of a single active goal. Each active goal tracks one exercise, one target weight, and one required deadline. Goals should be sorted by nearest deadline first, auto-complete when the target is reached, and auto-expire when the deadline passes before completion.

The goal page should become a dedicated goal management surface with separate sections for active goals, completed history, and overdue history. The dashboard should show all active goals at once using compact full cards instead of a single hero goal card.

## Goals

- Allow each user to have up to three active goals at the same time.
- Keep only one active goal per exercise.
- Require a deadline for every active goal.
- Automatically move finished goals into a completed history section.
- Automatically move missed goals into an overdue history section.
- Show all active goals in both `/goal` and `/dashboard`.
- Keep completed and overdue goals read-only.

## Non-Goals

- Reactivating an overdue goal in this iteration.
- Editing completed or overdue goals.
- Deleting completed history from the normal user UI.
- Allowing more than three active goals.
- Supporting multiple concurrent active goals for the same exercise.

## Chosen Approach

Use a strict multi-goal lifecycle:

1. A user may create up to three active goals.
2. Each exercise may only have one active goal at a time.
3. Every active goal must include a deadline.
4. Active goals are ordered by nearest deadline first.
5. If the user's best 1RM for the goal exercise reaches or exceeds the target weight, the goal automatically becomes `completed`.
6. If the deadline passes before the target is reached, the goal automatically becomes `overdue`.
7. Completed and overdue goals remain visible as read-only history.
8. If a user wants to pursue the same exercise again after completion or expiry, they create a brand-new goal.

This keeps the UX clear, prevents duplicate active goals for the same exercise, and avoids ambiguous "resume" states.

## User Experience

### Goal Page

The `/goal` page should evolve from a single-goal editor into a management view with three sections:

- `Goal Aktif`
- `Riwayat Selesai`
- `Terlambat`

#### Active Goals

Active goals should render as a vertical stack of up to three full cards.

Each active card should show:

- exercise name
- progress indicator
- current 1RM
- target weight
- deadline badge
- warning state if deadline is close

The create button should stay visible even when the user already has three active goals, but it should become disabled with helper copy such as `Maksimal 3 goal aktif`.

#### Creating A Goal

When the user creates a goal:

- deadline is required
- if the selected exercise already has an active goal, the UI should switch into edit mode for that existing goal instead of creating a duplicate
- if the user already has three active goals, creation is blocked with a clear inline explanation

#### Completed History

Completed goals should appear in a separate read-only history section.

Each history item should show:

- exercise name
- target weight
- final achieved 1RM
- completion date
- `Completed` badge

Completed items should not expose edit or delete actions in this iteration.

#### Overdue History

Overdue goals should appear in their own read-only section below completed goals or below active goals, depending on page flow.

Each overdue item should show:

- exercise name
- target weight
- best reached 1RM
- original deadline
- overdue badge in red

Overdue items should not be editable or restorable in this iteration. If the user wants to try again, they create a new goal.

### Dashboard

The `/dashboard` page should stop assuming a single goal.

Instead of one large hero goal card, the dashboard should show up to three compact full goal cards. They should remain visually substantial enough to read comfortably on mobile, but smaller than the current single-goal hero treatment.

Each dashboard goal card should show:

- exercise name
- progress
- current 1RM
- target weight
- deadline badge

Cards should be sorted by nearest deadline first. Goals with deadlines of three days or less should receive warning styling.

Completed and overdue goals should not appear on the dashboard. The dashboard should remain focused on currently actionable goals only.

## Data Model

### Goal

Extend `Goal` with lifecycle fields:

- `status`: `active | completed | overdue`
- `completedAt`: nullable `DateTime`
- `expiredAt`: nullable `DateTime`

Existing fields remain:

- `exerciseId`
- `targetWeight`
- `currentWeight`
- `deadline`
- `createdAt`
- `updatedAt`

Rules:

- active goals must always have a deadline
- completed goals have `status=completed` and `completedAt`
- overdue goals have `status=overdue` and `expiredAt`

### Business Constraints

Application-level constraints should enforce:

- maximum three active goals per user
- maximum one active goal per exercise per user

These may later be strengthened with a partial unique index if desired, but the first iteration can enforce them in server actions.

## Query And Sorting Rules

### Active Goal Sorting

Sort active goals by:

1. nearest deadline first
2. older creation time first as tie-breaker

This keeps the most urgent goal at the top.

### Goal Page Queries

The goal page should load:

- active goals
- completed goals
- overdue goals
- best current 1RM values per exercise referenced by those goals

Completed and overdue collections may be capped or paginated later, but a simple recent-history list is acceptable for the first version.

### Dashboard Queries

The dashboard should fetch active goals only and serialize each card with its current exercise metadata and best current 1RM.

## Automation Rules

### Completion

A goal becomes `completed` when:

- the user's best recorded 1RM for that goal exercise is greater than or equal to the goal's target weight

When this happens:

- `status` changes to `completed`
- `completedAt` is filled
- the goal disappears from the active list
- the active slot becomes available again

### Expiry

A goal becomes `overdue` when:

- current date is later than the deadline
- the goal is still `active`
- the best recorded 1RM is still below the target

When this happens:

- `status` changes to `overdue`
- `expiredAt` is filled
- the goal leaves the active list

### Where Automation Runs

Lifecycle transitions should be enforced whenever goal data is fetched for core surfaces, especially:

- `/goal`
- `/dashboard`

This ensures the UI stays truthful without relying on scheduled jobs in the first iteration.

## Form Behavior

The create and edit form should support:

- exercise selection
- target weight
- required deadline

Validation should reject:

- missing exercise
- missing deadline
- non-positive target weight
- more than three active goals
- duplicate active goal for the same exercise

If a duplicate active goal is attempted, the system should open the existing active goal in edit mode and present a small explanatory message.

## UI Behavior Details

### Warning States

For active goals:

- if `daysLeft <= 3`, show warning styling
- warning styling should use both color and icon, not color alone

### Empty States

If the user has:

- no active goals: show an instructional empty state with a clear `Tambah Goal` action
- no completed goals: omit the section or show a subtle empty hint
- no overdue goals: omit the section or show a subtle empty hint

### Touch And Responsive Considerations

- active cards should remain full-width and readable on mobile
- actions should meet touch target expectations
- dashboard cards should compress vertically, not shrink into unreadable mini cards
- long exercise names should wrap or truncate gracefully with `min-w-0`

## Migration Considerations

Existing users may already have one goal row without status fields.

Migration behavior should be:

- backfill existing goal rows to `status=active`
- leave `completedAt` and `expiredAt` null
- preserve current deadline and target values

If multiple legacy rows already exist unexpectedly, the newest row can be treated as active during migration review, but implementation should explicitly define how to normalize this data.

## Testing

### Functional

- user can create a first, second, and third active goal
- user cannot create a fourth active goal
- user cannot create a second active goal for the same exercise
- duplicate active exercise selection opens edit flow instead
- active goals are ordered by nearest deadline first
- goal auto-moves to completed when target is reached
- goal auto-moves to overdue when deadline passes without completion
- dashboard shows all active goals and excludes completed/overdue goals

### UI

- goal page remains readable with one, two, or three active cards
- dashboard remains readable with three compact goal cards on mobile
- warning styling appears when deadline is within three days
- disabled create action is understandable when three active goals already exist

### Data Integrity

- completed goals remain read-only
- overdue goals remain read-only
- completed and overdue goals do not count toward the three active goal limit
- lifecycle transitions do not duplicate or delete goal rows unexpectedly
