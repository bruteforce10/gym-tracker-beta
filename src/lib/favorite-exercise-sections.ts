type FavoriteExerciseListItem = {
  id: string;
  isFavorite: boolean;
};

type FavoriteExerciseSections<T extends FavoriteExerciseListItem> = {
  favorites: T[];
  recent?: T[];
  results: T[];
};

function syncFavoriteList<T extends FavoriteExerciseListItem>(
  items: T[] | undefined,
  exerciseId: string,
  nextValue: boolean,
  removeItem = false
) {
  const nextItems =
    items?.map((item) =>
      item.id === exerciseId ? { ...item, isFavorite: nextValue } : item
    ) ?? [];

  return removeItem
    ? nextItems.filter((item) => item.id !== exerciseId)
    : nextItems;
}

function findExerciseInSections<T extends FavoriteExerciseListItem>(
  sections: FavoriteExerciseSections<T>,
  exerciseId: string
) {
  return (
    sections.favorites.find((item) => item.id === exerciseId) ??
    sections.recent?.find((item) => item.id === exerciseId) ??
    sections.results.find((item) => item.id === exerciseId) ??
    null
  );
}

export function updateFavoriteExerciseSections<T extends FavoriteExerciseListItem>(
  sections: FavoriteExerciseSections<T>,
  exerciseId: string,
  nextValue: boolean
) {
  const recent = syncFavoriteList(
    sections.recent,
    exerciseId,
    nextValue,
    nextValue
  );
  const results = syncFavoriteList(
    sections.results,
    exerciseId,
    nextValue,
    nextValue
  );
  const syncedFavorites = syncFavoriteList(
    sections.favorites,
    exerciseId,
    nextValue
  );

  if (!nextValue) {
    return {
      ...sections,
      favorites: syncedFavorites.filter((item) => item.id !== exerciseId),
      recent,
      results,
    };
  }

  if (syncedFavorites.some((item) => item.id === exerciseId)) {
    return {
      ...sections,
      favorites: syncedFavorites,
      recent,
      results,
    };
  }

  const exercise = findExerciseInSections(sections, exerciseId);
  if (!exercise) {
    return {
      ...sections,
      favorites: syncedFavorites,
      recent,
      results,
    };
  }

  return {
    ...sections,
    favorites: [{ ...exercise, isFavorite: true }, ...syncedFavorites],
    recent,
    results,
  };
}
