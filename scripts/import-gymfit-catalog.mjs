import "dotenv/config";

import fs from "node:fs";
import path from "node:path";
import { Client } from "pg";
import { UTApi, UTFile } from "uploadthing/server";

const DEFAULT_API_BASE_URL = "https://gym-fit.p.rapidapi.com";
const SEARCH_PAGE_SIZE = 100;
const DEFAULT_BATCH_SIZE = 100;
const DETAIL_CONCURRENCY = 3;
const STATE_DIR = path.join(process.cwd(), ".cache");
const STATE_PATH = path.join(STATE_DIR, "gymfit-import-state.json");

const utapi = new UTApi({
  token: process.env.UPLOADTHING_TOKEN,
  logLevel: "None",
});

class GymFitQuotaExceededError extends Error {
  constructor(message) {
    super(message);
    this.name = "GymFitQuotaExceededError";
  }
}

function getEnv(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} environment variable is not set`);
  }
  return value;
}

function getGymFitHeaders() {
  return JSON.parse(getEnv("GYMFIT_API_HEADERS"));
}

function getGymFitBaseUrl() {
  return (process.env.GYMFIT_API_BASE_URL ?? DEFAULT_API_BASE_URL).replace(/\/+$/, "");
}

function asString(value) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

function parseArgs(argv) {
  const args = {
    batchSize: DEFAULT_BATCH_SIZE,
    delayMs: 0,
    resetProgress: false,
  };

  for (const arg of argv) {
    if (arg === "--reset-progress") {
      args.resetProgress = true;
      continue;
    }

    if (arg.startsWith("--batch-size=")) {
      const value = Number.parseInt(arg.split("=")[1] ?? "", 10);
      if (Number.isFinite(value) && value > 0) {
        args.batchSize = value;
      }
      continue;
    }

    if (arg.startsWith("--delay-ms=")) {
      const value = Number.parseInt(arg.split("=")[1] ?? "", 10);
      if (Number.isFinite(value) && value >= 0) {
        args.delayMs = value;
      }
    }
  }

  return args;
}

function ensureStateDir() {
  fs.mkdirSync(STATE_DIR, { recursive: true });
}

function readState() {
  if (!fs.existsSync(STATE_PATH)) {
    return {
      lastCompletedOffset: 0,
      totalRefs: null,
      updatedAt: null,
    };
  }

  try {
    const raw = JSON.parse(fs.readFileSync(STATE_PATH, "utf8"));
    return {
      lastCompletedOffset:
        Number.isFinite(raw.lastCompletedOffset) && raw.lastCompletedOffset >= 0
          ? raw.lastCompletedOffset
          : 0,
      totalRefs: Number.isFinite(raw.totalRefs) ? raw.totalRefs : null,
      updatedAt: typeof raw.updatedAt === "string" ? raw.updatedAt : null,
    };
  } catch {
    return {
      lastCompletedOffset: 0,
      totalRefs: null,
      updatedAt: null,
    };
  }
}

function writeState(nextState) {
  ensureStateDir();
  fs.writeFileSync(
    STATE_PATH,
    JSON.stringify(
      {
        ...nextState,
        updatedAt: new Date().toISOString(),
      },
      null,
      2
    )
  );
}

function resetState() {
  if (fs.existsSync(STATE_PATH)) {
    fs.unlinkSync(STATE_PATH);
  }
}

function buildExerciseSlug(name, externalId) {
  const baseSlug =
    name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 60) || "exercise";

  return `${baseSlug}--${externalId}`;
}

function safeFileSegment(value, fallback = "file") {
  return (
    value
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 80) || fallback
  );
}

function normalizeTrainingStyle(name, type) {
  const normalizedType = (type ?? "").trim().toLowerCase();
  if (normalizedType === "compound" || normalizedType === "isolation") {
    return normalizedType;
  }

  const normalizedName = name.trim().toLowerCase();
  const compoundHints = [
    "press",
    "row",
    "deadlift",
    "squat",
    "pull up",
    "pull-up",
    "pulldown",
    "dip",
    "lunge",
    "thrust",
    "clean",
    "snatch",
    "shrug",
  ];

  if (compoundHints.some((hint) => normalizedName.includes(hint))) {
    return "compound";
  }

  return "isolation";
}

async function requestGymFit(pathname, params = {}) {
  const url = new URL(`${getGymFitBaseUrl()}${pathname}`);

  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === "") continue;
    url.searchParams.set(key, String(value));
  }

  const response = await fetch(url, {
    method: "GET",
    headers: getGymFitHeaders(),
  });

  if (!response.ok) {
    const details = await response.text();
    if (response.status === 429) {
      throw new GymFitQuotaExceededError(
        `Gym Fit request failed: ${response.status} ${response.statusText} - ${details}`
      );
    }
    throw new Error(`Gym Fit request failed: ${response.status} ${response.statusText} - ${details}`);
  }

  return response.json();
}

async function uploadImageToUploadThing(imageUrl, exerciseId, exerciseName) {
  const normalizedUrl = asString(imageUrl);
  if (!normalizedUrl) return null;

  try {
    const parsedUrl = new URL(normalizedUrl);
    const extensionMatch = parsedUrl.pathname.match(/\.(png|jpe?g|webp|gif|avif)$/i);
    const extension = (extensionMatch?.[1] ?? "png").toLowerCase();
    const fileName = `${safeFileSegment(exerciseId, "exercise")}-${safeFileSegment(exerciseName, "exercise")}.${extension}`;

    const sourceResponse = await fetch(normalizedUrl, { method: "GET" });
    if (!sourceResponse.ok) {
      console.warn(
        `Source image download failed for exercise ${exerciseId}: ${sourceResponse.status} ${sourceResponse.statusText}`
      );
      return null;
    }

    const arrayBuffer = await sourceResponse.arrayBuffer();
    const contentType =
      asString(sourceResponse.headers.get("content-type")) ??
      `image/${extension === "jpg" ? "jpeg" : extension}`;
    const uploadFile = new UTFile([Buffer.from(arrayBuffer)], fileName, {
      type: contentType,
    });

    const uploadResult = await utapi.uploadFiles(
      uploadFile,
      {
        concurrency: 1,
      }
    );

    if (uploadResult.error || !uploadResult.data?.ufsUrl) {
      console.warn(
        `UploadThing upload failed for exercise ${exerciseId}: ${uploadResult.error?.message ?? "unknown error"}`
      );
      return null;
    }

    return uploadResult.data.ufsUrl;
  } catch (error) {
    console.warn(
      `UploadThing upload failed for exercise ${exerciseId}: ${error instanceof Error ? error.message : "unknown error"}`
    );
    return null;
  }
}

async function fetchExerciseRefs() {
  const refs = [];
  let offset = 0;
  let total = Number.POSITIVE_INFINITY;

  while (offset < total) {
    const payload = await requestGymFit("/v1/exercises/search", {
      limit: SEARCH_PAGE_SIZE,
      offset,
    });

    const results = Array.isArray(payload.results) ? payload.results : [];
    total = typeof payload.total === "number" ? payload.total : results.length;
    refs.push(...results);

    if (results.length === 0) break;
    offset += results.length;
  }

  return refs;
}

async function fetchExerciseDetails(refs, options) {
  const details = [];
  let processed = 0;

  for (let index = 0; index < refs.length; index += DETAIL_CONCURRENCY) {
    const batch = refs.slice(index, index + DETAIL_CONCURRENCY);
    const batchDetails = await Promise.all(
      batch.map(async (ref) => {
        const id = asString(ref.id);
        if (!id) return null;
        const detail = await requestGymFit(`/v1/exercises/${encodeURIComponent(id)}`);
        const hostedImageUrl = await uploadImageToUploadThing(
          asString(detail.image) ?? asString(ref.image),
          id,
          asString(detail.name) ?? asString(ref.name) ?? id
        );
        if (options.delayMs > 0) {
          await sleep(options.delayMs);
        }
        return {
          ...detail,
          id,
          image: hostedImageUrl,
          bodyPart: asString(detail.bodyPart) ?? asString(ref.bodyPart),
        };
      })
    );

    details.push(...batchDetails.filter(Boolean));
    processed = Math.min(index + batch.length, refs.length);
    console.log(`Fetched details ${processed}/${refs.length}`);
  }

  return details;
}

function toStringArray(value) {
  if (Array.isArray(value)) {
    return value
      .map((item) => {
        if (!item || typeof item !== "object") return null;
        return asString(item.name);
      })
      .filter(Boolean);
  }

  if (typeof value === "string" && value.trim()) {
    return [value.trim()];
  }

  return [];
}

function normalizeExerciseRecord(record) {
  const id = asString(record.id);
  const name = asString(record.name);
  if (!id || !name) return null;

  const bodyPart = asString(record.bodyPart);
  const equipment = asString(record.equipment);
  const exerciseType = asString(record.type);

  return {
    id,
    slug: buildExerciseSlug(name, id),
    name,
    bodyParts: bodyPart ? [bodyPart] : [],
    equipments: equipment ? [equipment] : [],
    gender: null,
    exerciseType,
    targetMuscles: toStringArray(record.targetMuscles),
    secondaryMuscles: toStringArray(record.secondaryMuscles),
    imageUrl: asString(record.image),
    videoUrl: null,
    trainingStyle: normalizeTrainingStyle(name, exerciseType),
  };
}

async function upsertExercises(client, exercises) {
  let inserted = 0;

  for (const exercise of exercises) {
    await client.query(
      `
        INSERT INTO "Exercise" (
          "id",
          "slug",
          "name",
          "bodyParts",
          "equipments",
          "gender",
          "exerciseType",
          "targetMuscles",
          "secondaryMuscles",
          "imageUrl",
          "videoUrl",
          "trainingStyle",
          "createdAt",
          "updatedAt"
        )
        VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW(), NOW()
        )
        ON CONFLICT ("id") DO UPDATE SET
          "slug" = EXCLUDED."slug",
          "name" = EXCLUDED."name",
          "bodyParts" = EXCLUDED."bodyParts",
          "equipments" = EXCLUDED."equipments",
          "gender" = EXCLUDED."gender",
          "exerciseType" = EXCLUDED."exerciseType",
          "targetMuscles" = EXCLUDED."targetMuscles",
          "secondaryMuscles" = EXCLUDED."secondaryMuscles",
          "imageUrl" = COALESCE(EXCLUDED."imageUrl", "Exercise"."imageUrl"),
          "videoUrl" = EXCLUDED."videoUrl",
          "trainingStyle" = EXCLUDED."trainingStyle",
          "updatedAt" = NOW()
      `,
      [
        exercise.id,
        exercise.slug,
        exercise.name,
        exercise.bodyParts,
        exercise.equipments,
        exercise.gender,
        exercise.exerciseType,
        exercise.targetMuscles,
        exercise.secondaryMuscles,
        exercise.imageUrl,
        exercise.videoUrl,
        exercise.trainingStyle,
      ]
    );

    inserted += 1;
  }

  return inserted;
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  const databaseUrl = getEnv("DATABASE_URL");
  const client = new Client({
    connectionString: databaseUrl,
  });

  await client.connect();

  try {
    if (options.resetProgress) {
      resetState();
      console.log("Import checkpoint reset.");
    }

    console.log("Fetching Gym Fit catalog references...");
    const refs = await fetchExerciseRefs();
    console.log(`Found ${refs.length} exercise references.`);

    const state = readState();
    const startOffset = Math.min(state.lastCompletedOffset, refs.length);
    const batchRefs = refs.slice(startOffset, startOffset + options.batchSize);

    if (batchRefs.length === 0) {
      console.log(
        JSON.stringify(
          {
            totalRefs: refs.length,
            startOffset,
            processedThisRun: 0,
            nextOffset: startOffset,
            remaining: 0,
            completed: true,
          },
          null,
          2
        )
      );
      return;
    }

    console.log(
      `Importing batch starting at offset ${startOffset} with batch size ${options.batchSize}.`
    );
    if (options.delayMs > 0) {
      console.log(`Using delay ${options.delayMs}ms between detail requests.`);
    }

    console.log("Fetching Gym Fit exercise details...");
    const details = await fetchExerciseDetails(batchRefs, options);
    const normalized = details.map(normalizeExerciseRecord).filter(Boolean);

    console.log("Writing catalog into Prisma/Postgres...");
    const upserted = await upsertExercises(client, normalized);
    const nextOffset = startOffset + batchRefs.length;
    const remaining = Math.max(refs.length - nextOffset, 0);

    writeState({
      lastCompletedOffset: nextOffset,
      totalRefs: refs.length,
    });

    console.log(
      JSON.stringify(
        {
          totalRefs: refs.length,
          startOffset,
          processedThisRun: batchRefs.length,
          detailed: details.length,
          upserted,
          nextOffset,
          remaining,
          completed: remaining === 0,
        },
        null,
        2
      )
    );
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  if (error instanceof GymFitQuotaExceededError) {
    console.error("Gym Fit import paused due to quota limit.");
    console.error(error.message);
    console.error(`Checkpoint remains at: ${readState().lastCompletedOffset}`);
    process.exitCode = 1;
    return;
  }

  console.error("Gym Fit import failed:", error);
  process.exitCode = 1;
});
