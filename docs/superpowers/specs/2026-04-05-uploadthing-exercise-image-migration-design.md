# UploadThing Exercise Image Migration Design

## Summary

Exercise images currently come from Gym Fit signed URLs. Those URLs expire and lead to `403 Forbidden`, which breaks image previews even though the exercise records already live in Prisma/Postgres. A temporary local-disk mirror was added, but large image files can burden the app server.

This change moves exercise image storage to UploadThing. The importer will fetch the source image from Gym Fit, upload it to UploadThing, and persist the UploadThing URL in Prisma. Runtime pages will continue reading image URLs from Prisma and will fall back to gradient placeholders when an image is missing or fails to load.

## Goals

- Stop relying on expiring Gym Fit signed image URLs at runtime.
- Remove local app storage as the primary long-term image host.
- Keep the importer resumable and safe to rerun.
- Preserve the current UI fallback behavior when an image is unavailable.

## Non-Goals

- Adding a user-facing upload flow.
- Introducing image compression or transformation in this iteration.
- Reworking the `Exercise` schema beyond storing the final hosted URL.
- Migrating exercise videos.

## Current Problems

- Gym Fit image URLs expire roughly after one day and start returning `403`.
- Storing images under `public/exercises/images` can create large server-side assets.
- The importer currently mirrors images locally, so media hosting is tied to the app deployment.

## Chosen Approach

Use the existing catalog importer as the single migration pipeline:

1. Fetch exercise references and details from Gym Fit.
2. Download each image to a temporary local file or memory buffer.
3. Upload that image to UploadThing using the server token already present in `.env`.
4. Store the UploadThing URL in `Exercise.imageUrl`.
5. Delete any temporary file created during the upload step.
6. Continue using UI-level fallback placeholders for missing or failed images.

This keeps the runtime path simple: app pages only read URLs from Prisma, while importer logic owns all remote media transfer.

## Architecture Changes

### Importer

`scripts/import-gymfit-catalog.mjs` will be updated so the image step becomes:

- `downloadImageTemporarily(...)`
- `uploadImageToUploadThing(...)`
- `cleanupTemporaryImage(...)`

The previous local-public mirror logic becomes temporary staging only. The importer should no longer treat `/public/exercises/images` as the final destination.

The importer must continue to support:

- resumable checkpointing
- `--batch-size`
- `--delay-ms`
- `--reset-progress`

The checkpoint should advance only after:

- Gym Fit detail fetch succeeds
- UploadThing upload succeeds or is intentionally recorded as `null`
- Prisma upsert succeeds

### Runtime

Runtime pages do not need a new storage abstraction. They already read `Exercise.imageUrl` from Prisma. Since UploadThing returns standard HTTPS URLs, the existing rendering flow remains intact once `next.config.ts` allows the UploadThing host.

### UI Fallback

The current fallback system remains:

- list cards render thumbnail if available
- list cards render gradient + monogram if missing or failed
- detail page renders image if available
- detail page renders gradient hero fallback if missing or failed

No new UI controls are required.

## Data Model

No Prisma schema migration is required if `Exercise.imageUrl` continues to store a nullable string URL.

Expected values after this change:

- `https://...uploadthing...` for successfully uploaded images
- `null` when an image is unavailable or upload failed

Old values that should gradually disappear after rerunning the importer:

- signed Gym Fit image URLs
- local `/exercises/images/...` paths

## Error Handling

### Gym Fit Failure

- If Gym Fit returns `429`, importer stops without advancing the current batch checkpoint.
- Existing resumable behavior remains.

### UploadThing Failure

- If UploadThing upload fails for an item, importer logs the failure.
- That exercise is still upserted with `imageUrl = null`.
- UI fallback handles the missing image gracefully.

### Cleanup Failure

- Temporary file cleanup failures are logged but must not corrupt the batch.
- The importer should continue processing unless temp accumulation becomes critical.

## Operational Flow

Recommended operator flow:

1. Run a tiny validation batch with `--batch-size=1 --reset-progress`.
2. Confirm Prisma stores an UploadThing URL.
3. Confirm `/exercises` and `/exercises/[slug]` render correctly.
4. Resume the remaining catalog with moderate batch sizes.

Suggested follow-up import command:

```bash
npm run exercise:import -- --batch-size=25 --delay-ms=300
```

## Testing

### Functional Checks

- Import one exercise and confirm `Exercise.imageUrl` is an UploadThing URL.
- Confirm no runtime request depends on Gym Fit image URLs after migration.
- Confirm existing image fallback still appears when `imageUrl` is `null`.

### Regression Checks

- `eslint`
- `next build`
- spot-check one catalog card and one detail page

## Risks

- UploadThing API shape may require adding a dependency or direct HTTP upload flow.
- Upload speed may become the new bottleneck during import.
- Partial migration can leave a mixed catalog until the importer completes.

## Rollout Plan

1. Add UploadThing upload support in the importer.
2. Update Next image config for UploadThing host if needed.
3. Validate one-item import.
4. Continue resumable import until all image records are refreshed.
5. Optionally remove old local mirrored files after confirming migration is complete.

## Success Criteria

- Exercise images no longer depend on expiring Gym Fit signed URLs.
- Runtime app pages load images from UploadThing or show graceful fallback.
- The app server no longer needs to serve large mirrored exercise images as the primary solution.
- The importer remains safe to rerun and safe to resume after interruption.
