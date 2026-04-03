# Workout Planning & Guided Exercise Flow — Design Spec

## Overview

Fitur ini mengubah pengalaman logging latihan dari manual menjadi guided, terstruktur, dan otomatis. Sistem menyediakan workout plan, membimbing user step-by-step saat latihan, mengelola rest timer otomatis, dan menyimpan hasil secara otomatis setelah sesi selesai.

## Architecture & Navigation

### Route Changes

| Route | Type | Fungsi |
|---|---|---|
| `/plan` | New | Konfigurasi workout plan — kelola Upper/Lower plans, exercise library, default set/reps/rest |
| `/workout/session` | New | Fullscreen guided workout — step-by-step per set, rest timer, progress indicator |

### Bottom Nav Update

**Before:** Dashboard · Progress · [FAB] · Goal · Profile
**After:** Dashboard · Progress · [FAB] · Plan · Profile

Goal page dihapus dari bottom nav — Goal tetap sebagai card di Dashboard dan bisa diakses lewat tombol di sana.

### FAB Behavior

Saat user tap FAB, tampilkan bottom sheet kecil dengan dua opsi:
1. **"Mulai Plan"** → navigasi ke pilih Upper/Lower → pilih exercise → `/workout/session`
2. **"Log Manual"** → buka sheet manual yang sudah ada

## Data Model

### New Prisma Models

```prisma
model WorkoutPlan {
  id        String                @id @default(cuid())
  userId    String
  name      String                // "Upper Body" / "Lower Body" / custom
  type      String                // "upper" | "lower" | "custom"
  createdAt DateTime              @default(now())
  updatedAt DateTime              @updatedAt

  user      User                  @relation(fields: [userId], references: [id], onDelete: Cascade)
  exercises WorkoutPlanExercise[]
}

model WorkoutPlanExercise {
  id           String      @id @default(cuid())
  planId       String
  exerciseId   String      // references static exercise library ID
  defaultSets  Int         @default(3)
  defaultReps  Int         @default(10)
  restTime     Int         @default(60) // seconds
  order        Int         // display order in session

  plan         WorkoutPlan @relation(fields: [planId], references: [id], onDelete: Cascade)
}
```

### Modified Existing Models

User model — add relation:
```prisma
  workoutPlans WorkoutPlan[]
```

## Exercise Library (Static Data)

Stored as `src/data/exercises.ts` — not in database. Users reference exercise IDs in their plans.

### Structure
```typescript
interface Exercise {
  id: string           // "bench-press"
  name: string         // "Bench Press"
  category: Category   // "chest" | "back" | "shoulder" | "arms" | "quads" | "hamstrings" | "glutes" | "calves"
  muscleGroup: string  // "Pectoralis Major"
  type: "compound" | "isolation"
  defaultRestTime: number  // seconds
  imageUrl: string     // path to generated image
}
```

### Exercise Catalog (~30 exercises)

| Kategori | Exercises |
|---|---|
| Chest | Bench Press, Incline DB Press, Chest Fly, Push Up, Cable Crossover |
| Back | Lat Pulldown, Barbell Row, Seated Cable Row, Pull Up, Deadlift |
| Shoulder | Overhead Press, Lateral Raise, Face Pull, Arnold Press, Front Raise |
| Arms | Bicep Curl, Hammer Curl, Tricep Dips, Skull Crusher, Cable Pushdown |
| Quads | Squat, Leg Press, Leg Extension, Hack Squat, Bulgarian Split Squat |
| Hamstrings | Romanian Deadlift, Leg Curl, Nordic Curl, Good Morning |
| Glutes | Hip Thrust, Glute Bridge, Cable Kickback |
| Calves | Calf Raise, Seated Calf Raise |

### Rest Time Rules
- Compound exercise: **90 seconds**
- Isolation exercise: **60 seconds**
- User can override per exercise in their plan

## Guided Workout Flow

### State Machine
```
FAB_MENU → SELECT_TYPE → SELECT_EXERCISES → WORKOUT_SESSION
```

### Within Session (per exercise):
```
SHOW_EXERCISE → INPUT_WEIGHT_REPS → IN_SET → RESTING → (next set or next exercise) → COMPLETE
```

### Session UX Detail

1. **Progress header**: "Exercise 2 of 5 · Set 1 of 3" with progress bar
2. **Exercise card**: Image + name + target muscle
3. **Input once**: Weight + reps per exercise (pre-fill placeholder from last session history)
4. **Per set**: Large "DONE ✓" button → triggers rest timer
5. **Rest timer**: Circular countdown animation, Skip button, +30s button
6. **Auto-advance**: After all sets → next exercise
7. **Completion**: After last exercise → auto-save → redirect to dashboard with success toast

### Rest Timer
- Circular arc animation (countdown)
- Skip and +30s buttons
- Browser vibration on complete (if supported)
- Default time from exercise type (compound: 90s, isolation: 60s)

## Auto-Save System

After last exercise completes:
1. Create `Workout` record with session date
2. Create multiple `ExerciseLog` records (one per exercise with actual weight/reps/sets)
3. Redirect to dashboard
4. Show success toast: "Sesi latihan selesai! 🎉"

## Plan Page (`/plan`)

- List of workout plans as cards (Upper Body, Lower Body)
- Tap card → view/edit exercise list (reorder, add/remove, change sets/reps/rest)
- "Create Custom Plan" button
- Default plans auto-created on first visit
- Exercise selection: Grouped by muscle category, checklist style

## Generated Images

AI-generated illustration for each major exercise (~30 images). Style: clean fitness illustration, dark background, consistent style across all images.
