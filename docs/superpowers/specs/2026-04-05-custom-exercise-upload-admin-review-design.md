# Custom Exercise Upload And Admin Review Design

## Summary

Users should be able to add their own custom exercises directly from the exercise catalog page. Newly created custom exercises should appear immediately in the creating user's exercise list, without being visible to other users by default. Admins need a dedicated dashboard to monitor these user-created exercises, edit them, delete them, and optionally promote them to global visibility for all users.

The feature also needs protection against bot submissions. Anti-bot verification should be applied at submission time, while normal users remain allowed to create custom exercises.

## Goals

- Add a `+ Tambah Exercise` entry point on the exercise catalog page.
- Allow normal authenticated users to create custom exercises.
- Make newly created custom exercises visible immediately to the creating user.
- Keep newly created custom exercises hidden from other users until promoted by admin.
- Add an admin-only exercise monitoring dashboard with edit, update, delete, and promote actions.
- Protect the submission flow against automated spam and bot abuse.
- Seed one admin account for `audifirdi@gmail.com`.

## Non-Goals

- Adding community voting, comments, or reporting in this iteration.
- Public browsing of every user-created exercise by default.
- Video uploads for custom exercises.
- Full moderation workflow with multi-step approval queues.

## Chosen Approach

Use a direct private publish model:

1. User submits a custom exercise form from `/exercises`.
2. Server validates the anti-bot token and the exercise payload.
3. The exercise is stored immediately as a custom exercise.
4. The new exercise becomes visible to the creator right away in the exercise list.
5. Admins can later review the record in a dedicated dashboard and optionally promote it to global visibility.

This gives the best UX for creators while still preserving administrative control.

## User Experience

### Exercise Catalog

On `/exercises`, add a primary action button such as `+ Tambah Exercise`.

When tapped:

- open a form sheet or modal
- allow the user to fill in exercise data
- validate required fields
- require anti-bot verification before final submit

After successful submit:

- close the form
- refresh the exercise list
- show the newly created custom exercise in the creator's catalog results

### Custom Exercise Visibility

Newly created custom exercises should:

- be visible to the creator immediately
- not be visible to other normal users
- remain editable only through the admin monitoring dashboard in this iteration

### Admin Dashboard

Add an admin-only page, recommended route:

- `/admin/exercises`

This page should show a table of custom exercises only, with useful monitoring columns:

- name
- creator email
- body part
- equipment
- visibility
- status
- created at
- updated at

Admin actions:

- edit
- update
- delete
- promote to global
- optionally mark as flagged or archived

## Data Model

### User

Extend `User` with:

- `role`: `user | admin`

Default role:

- all new registrations -> `user`

Seeded admin:

- email: `audifirdi@gmail.com`
- password input provided by user: `jika1515`
- store hashed password only

### Exercise

Extend `Exercise` to support both system and custom records:

- `source`: `system | user`
- `visibility`: `private | global`
- `status`: `published | flagged | archived`
- `createdByUserId`: nullable foreign key to `User`

Interpretation:

- imported catalog exercises:
  - `source=system`
  - `visibility=global`
  - `status=published`
- user-created exercises:
  - `source=user`
  - `visibility=private`
  - `status=published`
  - `createdByUserId=<creator id>`

## Query Rules

The exercise catalog query for an authenticated user should return:

1. all system exercises
2. all custom exercises created by that user
3. all custom exercises with `visibility=global`

This ensures:

- creators immediately see their own submissions
- other users do not see private custom exercises
- admin-promoted exercises become shared

## Security

### Anti-Bot Protection

Use `Cloudflare Turnstile` on the custom exercise form.

Validation rules:

- token must be submitted with the form
- token must be verified server-side before insert
- failed verification blocks creation

### Auth

Custom exercise creation requires authentication.

Rules:

- unauthenticated users cannot submit
- authenticated normal users can submit
- admin users can also submit if needed

### Admin Access Control

The admin dashboard must be protected server-side.

Rules:

- only users with `role=admin` can access `/admin/exercises`
- direct URL access by normal users should return redirect or forbidden behavior
- admin-only actions must check role on the server, not only in the UI

### Validation

Server-side validation should reject:

- empty names
- unrealistic field lengths
- malformed arrays
- unsupported enum values
- duplicate or near-empty submissions

Recommended additional safeguards:

- request throttling per authenticated user
- maximum exercise count per user over a given window

## Form Fields

Recommended fields for the first version:

- exercise name
- body part
- equipment
- training type
- target muscles
- secondary muscles
- optional image URL
- optional notes or short description

The form should stay smaller than the full admin schema and focus on fields already supported by the catalog.

## Admin Monitoring Behavior

The admin dashboard should only show custom user-created exercises, not the full imported system catalog.

Recommended filters:

- creator
- status
- visibility
- body part
- search by name

Recommended actions:

- save edits
- promote to global
- demote back to private if needed
- archive
- delete

## Routing

Recommended additions:

- `/exercises` -> add submit entry point
- `/admin/exercises` -> admin monitoring table

No separate user dashboard is needed for custom exercises in this iteration because newly created records already appear inside the main exercise catalog.

## Operational Notes

Admin seeding should happen safely:

- create or update the target user by email
- assign `role=admin`
- store hashed password
- do not hardcode plaintext password in runtime UI

## Testing

### Functional

- authenticated normal user can submit a custom exercise
- submitted exercise appears immediately in creator's `/exercises` list
- second normal user cannot see the first user's private custom exercise
- admin can access `/admin/exercises`
- admin can edit, delete, and promote a custom exercise
- promoted exercise appears to other users

### Security

- unauthenticated submit is rejected
- invalid Turnstile token is rejected
- normal user cannot access admin dashboard
- normal user cannot call admin actions directly

### Regression

- existing system exercise catalog still loads
- goal, plan, workout, and dashboard pages still resolve exercise names correctly

## Risks

- Turnstile integration adds one more external dependency to the submit flow
- admin moderation UI can grow in scope if too many bulk tools are added now
- custom exercises may need stronger deduplication rules later

## Rollout Plan

1. Add role support and admin seed.
2. Extend `Exercise` model for custom ownership and visibility.
3. Add creator-aware catalog queries.
4. Add custom exercise submission flow on `/exercises`.
5. Add Turnstile validation.
6. Add `/admin/exercises` dashboard and admin actions.
7. Verify private visibility and global promotion flow.

## Success Criteria

- Users can add custom exercises from the catalog page.
- Newly added exercises appear immediately in the creator's exercise list.
- Private custom exercises are hidden from other normal users.
- Admin can monitor and moderate user-created exercises from a dedicated dashboard.
- Admin can promote selected custom exercises to all users.
- Bot submissions are reduced through server-verified anti-bot protection.
