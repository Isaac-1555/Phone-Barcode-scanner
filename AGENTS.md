# AGENTS.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Scope and current state
- This is an Expo + React Native app using Expo Router and TypeScript.
- `README.md` is still the default Expo template; treat repository code as source of truth for behavior.
- There is no existing `WARP.md`, `CLAUDE.md`, Cursor rules, or Copilot instruction file in this repo.

## Common commands
- Install dependencies:
  - `npm install`
- Start development server:
  - `npm run start` (same as `npx expo start`)
- Run on iOS simulator/device:
  - `npm run ios`
- Run on Android emulator/device:
  - `npm run android`
- Run web target:
  - `npm run web`
- Lint:
  - `npm run lint`
- Reset to Expo starter scaffold (destructive/moves existing app code into `example/` depending on prompt):
  - `npm run reset-project`

## Tests and single-test runs
- No test framework/config is currently present (no Jest/Vitest config, no `test` script in `package.json`).
- Before adding test commands here, first introduce a test runner and scripts.

## Architecture overview
### Routing and screen flow
- File-based routing lives under `src/app`.
- Root layout is `src/app/_layout.tsx`, with a `Stack` and hidden headers.
- Current intended user flow:
  1. `login.tsx`: authenticate store number/password against Supabase.
  2. `department.tsx`: choose department and prefix.
  3. `scanner.tsx`: scan barcode (camera) or type manually.
  4. `comment.tsx`: optional per-barcode comment.
  5. `review.tsx`: review/delete scanned items and submit.
  6. `submitted.tsx`: confirmation, clears scanned items, returns to scanner.
- `explore.tsx` plus many `src/components/*` files are Expo starter/template artifacts and are not part of the primary scanner workflow.

### State management
- App state is centralized in `src/context/AppContext.tsx` and provided at app root in `_layout.tsx`.
- `AppState` tracks:
  - store identity (`storeNumber`, `storeId`)
  - department metadata (`department`, `prefix`)
  - session item buffer (`scannedItems`)
- State is in-memory only; there is no local persistence layer. Reload/restart loses session state.

### Data and backend integration
- Backend calls are in `src/services/supabase.ts` and use direct `fetch` requests against Supabase REST endpoints.
- Core operations:
  - `login`: fetch or create store record in `stores`.
  - `getNextListNumber`: compute next category/list name by reading latest matching `barcodes.category_name`.
  - `submitList`: bulk insert scanned barcodes to `barcodes`, then upsert comments to `barcode_comments`.
- Supabase URL and anon key are hardcoded constants in that service file; if backend config changes, update this file first.

### Path aliases and TS config
- TypeScript strict mode is enabled.
- Import aliases are defined in `tsconfig.json`:
  - `@/*` → `src/*`
  - `@/assets/*` → `assets/*`

## Practical guidance for edits
- When changing workflow behavior, update both:
  - route/screen transitions in `src/app/*.tsx`
  - corresponding context mutations in `src/context/AppContext.tsx`
- When changing submission/login semantics, keep `src/services/supabase.ts` and UI assumptions synchronized (especially list naming and comment handling limits).
