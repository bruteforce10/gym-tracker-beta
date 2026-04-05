import "server-only";

import { UTApi } from "uploadthing/server";

const utapi = new UTApi();

function extractUploadThingFileKey(url: string) {
  try {
    const parsed = new URL(url);
    const isUploadThingHost =
      parsed.hostname.endsWith(".ufs.sh") || parsed.hostname === "utfs.io";

    if (!isUploadThingHost) {
      return null;
    }

    const parts = parsed.pathname.split("/").filter(Boolean);
    const fileSegmentIndex = parts.findIndex((part) => part === "f");

    if (fileSegmentIndex === -1) {
      return null;
    }

    return parts[fileSegmentIndex + 1] ?? null;
  } catch {
    return null;
  }
}

export async function deleteUploadThingFileByUrl(url: string | null | undefined) {
  if (!url) {
    return false;
  }

  const fileKey = extractUploadThingFileKey(url);

  if (!fileKey) {
    return false;
  }

  try {
    await utapi.deleteFiles(fileKey);
    return true;
  } catch (error) {
    console.error("Failed to delete UploadThing file", {
      url,
      fileKey,
      error,
    });
    return false;
  }
}
