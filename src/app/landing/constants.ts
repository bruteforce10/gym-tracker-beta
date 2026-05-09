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

export const MARQUEE_ITEMS = [
  "280+ EXERCISES",
  "TRACK PROGRESS",
  "BUILD STREAK",
  "SHARE WORKOUT",
] as const;

export const DIFFERENTIATION_CARDS = [
  {
    title: "TRACK EVERYTHING",
    description: "280+ exercises, sets, reps, weights, and more.",
    icon: "zap",
  },
  {
    title: "BUILD REAL PROGRESS",
    description: "Smart reports to help you get stronger.",
    icon: "chart",
  },
  {
    title: "SHOW YOUR RESULTS",
    description: "Share workouts and inspire the community.",
    icon: "share",
    accent: true,
  },
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
