export const FEATURES = [
  {
    id: 1,
    number: "01",
    title: "TRACK EVERY REP",
    description: "Log sets, reps, and weights in seconds",
    imageAlt: "Workout tracking interface",
  },
  {
    id: 2,
    number: "02",
    title: "STRUCTURED TRAINING",
    description: "Upper, Lower, Split — ready to go",
    imageAlt: "Workout plans and programs",
  },
  {
    id: 3,
    number: "03",
    title: "HIT YOUR TARGET",
    description: "Set goals and track your strength journey",
    imageAlt: "Goal tracking progress",
  },
  {
    id: 4,
    number: "04",
    title: "SHARE YOUR GRIND",
    description: "Turn workouts into content like Strava",
    imageAlt: "Workout sharing and social features",
  },
  {
    id: 5,
    number: "05",
    title: "REAL-TIME TRACKING",
    description: "Instant feedback on your performance",
    imageAlt: "Real-time workout tracking",
  },
] as const;

export const MARQUEE_TEXT =
  "280+ EXERCISES • TRACK YOUR PROGRESS • SHARE YOUR WORKOUT • BUILD YOUR IDENTITY • REAL-TIME TRACKING •";

export const DIFFERENTIATION_CARDS = [
  { title: "TRACK EVERYTHING" },
  { title: "BUILD REAL PROGRESS" },
  { title: "SHOW YOUR RESULTS" },
] as const;

export const STATS = [
  { number: "280+", label: "EXERCISES" },
  { number: "REAL-TIME", label: "TRACKING" },
  { number: "WEEKLY", label: "REPORTS" },
  { number: "SOCIAL", label: "SHARING" },
] as const;

export const APP_SCREENS = [
  { name: "Dashboard", rotation: -2, spansTwo: false },
  { name: "Workout Plan", rotation: 0, spansTwo: true },
  { name: "Progress", rotation: 2, spansTwo: false },
  { name: "Workout Input", rotation: 0, spansTwo: true },
  { name: "Summary Share", rotation: -1, spansTwo: false },
] as const;
