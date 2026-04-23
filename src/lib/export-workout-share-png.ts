import {
  buildWorkoutShareStickerSvg,
  type WorkoutShareSummary,
  WORKOUT_SHARE_LOGO_PATH,
  WORKOUT_SHARE_STICKER_HEIGHT,
  WORKOUT_SHARE_STICKER_WIDTH,
} from "@/lib/workout-share";

let cachedLogoDataUrlPromise: Promise<string> | null = null;

export async function exportWorkoutSharePng(summary: WorkoutShareSummary) {
  await waitForFonts();

  const logoDataUrl = await getLogoDataUrl();
  const svgMarkup = buildWorkoutShareStickerSvg(summary, {
    logoHref: logoDataUrl,
  });
  const svgBlob = new Blob([svgMarkup], {
    type: "image/svg+xml;charset=utf-8",
  });
  const svgUrl = URL.createObjectURL(svgBlob);

  try {
    const image = await loadImage(svgUrl);
    const canvas = document.createElement("canvas");
    canvas.width = WORKOUT_SHARE_STICKER_WIDTH;
    canvas.height = WORKOUT_SHARE_STICKER_HEIGHT;

    const context = canvas.getContext("2d");
    if (!context) {
      throw new Error("Canvas context unavailable");
    }

    context.clearRect(0, 0, canvas.width, canvas.height);
    context.drawImage(image, 0, 0, canvas.width, canvas.height);

    const blob = await canvasToBlob(canvas);
    return new File([blob], summary.fileName, { type: "image/png" });
  } finally {
    URL.revokeObjectURL(svgUrl);
  }
}

export function downloadWorkoutSharePng(file: File) {
  const objectUrl = URL.createObjectURL(file);
  const anchor = document.createElement("a");
  anchor.href = objectUrl;
  anchor.download = file.name;
  anchor.rel = "noopener";
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(objectUrl), 0);
}

async function getLogoDataUrl() {
  if (!cachedLogoDataUrlPromise) {
    cachedLogoDataUrlPromise = fetch(WORKOUT_SHARE_LOGO_PATH)
      .then((response) => {
        if (!response.ok) {
          throw new Error("Failed to load share logo");
        }

        return response.blob();
      })
      .then(blobToDataUrl);
  }

  return cachedLogoDataUrlPromise;
}

function loadImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.decoding = "async";
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Failed to render workout share sticker"));
    image.src = src;
  });
}

function blobToDataUrl(blob: Blob) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result !== "string") {
        reject(new Error("Failed to convert asset to data URL"));
        return;
      }

      resolve(reader.result);
    };
    reader.onerror = () => reject(new Error("Failed to read asset"));
    reader.readAsDataURL(blob);
  });
}

function canvasToBlob(canvas: HTMLCanvasElement) {
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        reject(new Error("Failed to create PNG blob"));
        return;
      }

      resolve(blob);
    }, "image/png");
  });
}

async function waitForFonts() {
  if (typeof document === "undefined" || !("fonts" in document)) {
    return;
  }

  try {
    await document.fonts.ready;
  } catch {
    // If fonts fail to resolve, keep the export flow running with fallbacks.
  }
}
