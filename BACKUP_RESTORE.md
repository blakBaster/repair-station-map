# Repair Station Map — backup / rollback

## Stable restore points

### Pre-release backup
- Branch: `backup/pre-release-v38-2026-10-06`
- Commit: `21eb401c881d7d9dbee3a990cb801aed92bc7a3b`
- PWA: v38
- Supabase data snapshot schema: `backup_20261006_v38`

This snapshot was created before the public-release security hardening.

## Website rollback

The production site is GitHub Pages from `main`. To roll the website back, move `main` to the desired backup commit/branch after first checking the current head. Do not delete the backup branch.

Preferred recovery workflow:
1. Verify the current `main` SHA.
2. Create a temporary backup branch from that broken SHA.
3. Move `main` to the known-good backup SHA with force-with-lease.
4. Wait for GitHub Pages deployment.
5. Verify the site and PWA version.

## Database recovery

`backup_20261006_v38` is a data snapshot of the public tables plus metadata rows for the `station-photos` bucket. It is intentionally not an automatic destructive restore.

Before restoring database data:
1. Take a new snapshot of the current database.
2. Identify only the affected tables.
3. Restore selectively from `backup_20261006_v38`.
4. Never overwrite auth/passkey/security tables blindly.
5. Verify foreign keys and row counts before commit.

Supabase schema changes are also tracked in the project's migration history.

## Rule

Before every risky production change:
- create/update a dated GitHub backup branch;
- take a Supabase data snapshot when the change touches database data/schema;
- deploy;
- run smoke checks;
- only then continue with the next risky change.
