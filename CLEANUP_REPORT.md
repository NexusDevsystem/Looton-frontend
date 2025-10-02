# Cleanup Sweep – Dry Run Report (2025-10-02)

This report documents a safe, non-destructive cleanup sweep across the Looton repository (backend Node/TS + Fastify/Mongoose and mobile Expo/React Native + TS). No code, UX, or API behavior was modified during this phase; only reports were generated and candidates identified. Next step requires human confirmation before any deletion or archival.

## Branch
- Created branch: `chore/cleanup-sweep-20251002`
- Base branch detected locally: `publish-all-2025-10-01`

## Outputs and where to find them
- Backend reports: `backend/.reports/`
  - `ts-prune.json` – unused exports (generated)
  - `knip.json` – unused files/exports and dep insights (generated)
  - ESLint output – executed (see terminal logs); not auto-fixed
  - TypeScript `tsc --noEmit` – executed
- Mobile reports: `mobile/.reports/`
  - ESLint output – executed (see terminal logs); not auto-fixed
  - TypeScript `tsc --noEmit` – executed
  - Expo Doctor – `expo-doctor.txt` (text output)
  - knip – attempted (non-zero exit); skipped for now
- Repo-level textual scans: `.reports/`
  - `textual-scan-paths.txt` – file/dir name patterns (mocks/temp/legacy)
  - `assets-list.txt` – asset paths listed by extension (no deletions)

## Findings (evidence only)

### Backend
- TypeScript: ran (no blocking compile output captured here)
- ESLint: 22 issues (9 errors, 13 warnings). Examples (not fixed):
  - `seed-genres.js`: CommonJS requires in ESM context, undefined refs (likely legacy seed)
  - Some prefer-const, no-unused-vars warnings in routes/services
- ts-prune: notable unused exports reported (see `backend/.reports/ts-prune.json`):
  - `src/adapters/currency.service.ts: toBRL`
  - `src/jobs/index.ts: runAllNow`
  - `src/routes/debug.routes.ts: debugPushTokens`
  - `src/services/favorites.service.ts`: several helpers (shouldTriggerDesiredPrice, isInCooldown, matchesStore, toCents, getNotificationType, NotificationData (used in module))
- knip (see `backend/.reports/knip.json`):
  - Unused/standalone files flagged: `seed-genres-fixed.cjs`, `seed-genres.js`, `src/utils/price.ts`
  - Potentially unused dependencies (to be validated; no change in this pass)
- Registration check: all main routes are registered in `src/routes/index.ts` (debug routes are currently registered; don’t delete).

### Mobile
- ESLint: large volume of unused-var/any/no-empty warnings (163 errors). We are not refactoring logic in this cleanup; consider addressing in a separate linting pass.
- TypeScript: ran (noEmit) – no blocking output captured here.
- Expo Doctor (`mobile/.reports/expo-doctor.txt`):
  - Advisory: `@types/react-native` should not be installed directly (types included with RN).
  - Patch mismatches (expo, expo-notifications, expo-router) – we will not upgrade as part of cleanup.
- knip: attempted; produced non-zero exit. Skipped for safety this pass.

### Textual pattern scan (`.reports/textual-scan-paths.txt`)
- Flagged as likely sandbox/playground: `playground-1.mongodb.js` (repo root)
- No other matching directories (e.g., mocks/sandbox/legacy) turned up in this repository snapshot.

### Assets list (`.reports/assets-list.txt`)
- Listed common asset extensions across repo. We did not attempt to determine orphaned assets in this pass.

## Proposed next actions (awaiting confirmation)
We apply strict deletion policy: delete only if (unused by tooling) ∧ (clearly mock/temporary/legacy) ∧ (no side effects) ∧ (not referenced dynamically). When in doubt, archive to `/.attic/` preserving structure with an `@archived-by` header.

- Archive to `/.attic` (safer than delete):
  1) `playground-1.mongodb.js` – matches playground pattern; no known references.
  2) `backend/seed-genres.js` – not referenced by npm scripts; flagged by knip; legacy seed.
  3) `backend/seed-genres-fixed.cjs` – not referenced by npm scripts; flagged by knip; legacy seed.

- Deletions: none proposed at this stage.
- Dependency pruning: none in this pass (require stronger evidence; can revisit after archives and an additional run of knip/depcheck).

## Kept for now (with rationale)
- `backend/src/routes/debug.routes.ts` – explicitly registered in routes index; may be used for diagnostics.
- Any helpers flagged by ts-prune but possibly imported via side-effect or future work – keep until further validation.
- Mobile components with ESLint unused-var warnings – not removed; may be part of ongoing UI.
- Configs, examples, env examples, CI, LICENSE/README, migrations/seeds that are referenced – all kept.

## How to revert (after archival phase)
- We will move files into `/.attic/…`. To restore:
  - `git restore -s HEAD~1 -- <path>` or move back from `/.attic` to original location.
  - All archives will include a header comment `@archived-by: cleanup 2025-10-02`.

## Checklist for the PR (to be created after confirmation)
- [ ] Build backend OK (tsc, tests if any, start)
- [ ] Build mobile OK (tsc, eslint runs, expo-doctor non-critical)
- [ ] Critical routes tested: `/deals`, `/search` (backend reachable from mobile)
- [ ] No visual regressions
- [ ] No essential files removed (.env.example, README, LICENSE)

## Pending your confirmation
On approval, we will:
1) Move the three candidates to `/.attic/` (no deletions yet).
2) Re-run the dry-run tools.
3) If everything remains green, optionally consider pruning a clearly unused dependency set in a separate commit (only those confirmed by tooling and not referenced by configs/scripts).
4) Commit changes in small, labeled commits and open the PR “Cleanup sweep”. We will stop for human review without merging.

*** End of dry-run report ***
