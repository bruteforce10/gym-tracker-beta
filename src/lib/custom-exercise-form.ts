export type ExerciseComposerValues = {
  name: string;
  bodyPart: string;
  equipment: string;
  type: string;
  targetMuscles: string;
  secondaryMuscles: string;
  imageUrl: string;
  notes: string;
};

export const EMPTY_EXERCISE_COMPOSER_VALUES: ExerciseComposerValues = {
  name: "",
  bodyPart: "",
  equipment: "",
  type: "",
  targetMuscles: "",
  secondaryMuscles: "",
  imageUrl: "",
  notes: "",
};
