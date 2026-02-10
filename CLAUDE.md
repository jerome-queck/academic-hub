# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Web development
npm run dev              # Start Vite dev server at localhost:5173

# Electron development
npm run dev:electron     # Concurrent Vite + Electron (sets ELECTRON=true)

# Build
npm run build            # Web: tsc + vite build → dist/
npm run clean:release    # Remove old release artifacts and recreate release/
npm run build:mac        # Electron macOS: DMG + ZIP → release/
npm run build:win        # Electron Windows: NSIS + portable → release/
npm run build:linux      # Electron Linux: AppImage + DEB → release/

# Lint & test
npm run lint             # ESLint
npx vitest run           # Run all tests
npx vitest run src/utils/gpa.test.ts   # Run a single test file
```

## Architecture

**NTU GPA Calculator** — a React + Electron app for NTU students to track modules, GPA, and academic progress. Runs as both a web app and a native desktop app.

### Dual Build System

Vite config (`vite.config.ts`) conditionally enables Electron plugins when `ELECTRON=true`. The web build outputs to `dist/`, the Electron build to `dist-electron/`. A custom Vite plugin strips `crossorigin` attributes for Electron's `file://` protocol.

### State Management

Single Zustand store (`src/store/index.ts`) with Immer for immutable updates and persist middleware for localStorage (key: `ntu-gpa-storage`, version 3). The store holds all app state: modules, goals, snapshots, timetables, plannedModules, and UI state. Migration logic handles v0/v1/v2 → v3 upgrades and legacy `ntu_gpa_data` format.

Selectors like `useModulesByPeriod(year, sem)` are exported from the store file.

### View Routing

No router library — `App.tsx` switches views via `currentView` from the store. `DashboardView` and `SettingsView` are defined inline in `App.tsx`; other views are in `src/components/<feature>/`.

### GPA Calculation (`src/utils/gpa.ts`)

`calculateCompositeStats()` is the core function. It returns both **official** (Completed modules only) and **projected** (includes In Progress/Not Started with assigned grades) GPAs. Formula: `CGPA = Σ(Grade Point × AU) / Σ(Total AU attempted)`. All letter-graded courses including F count in the denominator. NTU uses a 5.0 scale (A+/A = 5.0 → F = 0.0). Grades S, U, P, Pass, Fail, EX, TC, IP, LOA are excluded from both numerator and denominator.

### Types

All domain types are in `src/types.ts`: Module, Grade, ModuleType, ModuleStatus, GoalSettings, TimetableEntry, PlannedModule, ExportData, ViewType.

### Tailwind CSS v4

Uses CSS-first configuration (`@import "tailwindcss"` in `index.css`). **Critical:** Dark mode requires `@custom-variant dark (&:where(.dark, .dark *));` in `index.css` — the `tailwind.config.js` `darkMode: 'class'` setting is ignored by v4. The `ThemeContext` toggles a `dark` class on `document.documentElement`.

### Electron IPC

`electron/main.ts` handles the main process (window, menus, file dialogs). `electron/preload.ts` exposes IPC methods to the renderer. File save/open dialogs use IPC channels (`show-save-dialog`, `show-open-dialog`, `save-file`, `read-file`).

### NTU-Specific Rules

- Dean's List: semester GPA ≥ 4.5 AND ≥ 15 graded AU
- Honours classification: First Class (≥4.5), Second Upper (≥4.0), Second Lower (≥3.5), Third Class (≥3.0)
- Default degree target: 130 AU

## Maintenance Rules

When making significant changes to the codebase (new features, removed features, changed commands, updated tech stack, or modified build steps), update `README.md` to reflect those changes. Keep the README in sync with the actual state of the project.

## Release-Driven Workflow

This repository follows a release-driven workflow for meaningful changes.

### PR Policy

- Every meaningful change (feature, fix, refactor, behavior change) should be scoped to a PR.
- Each PR should target a release intent: `patch`, `minor`, or `major`.
- Keep each PR focused on one theme.
- Use `.github/PULL_REQUEST_TEMPLATE.md` for every PR.

### Branching & PR Naming

- Branch naming: `codex/<short-scope>-<ticket-or-date>`
- PR title format: `[vX.Y.Z] <summary>` or `[minor|patch|major] <summary>`

## Changelog Discipline

`CHANGELOG.md` is the source of truth for user-visible version history.

- Every PR must add/update entries under `## Unreleased` in the correct section (`Added`, `Changed`, `Fixed`, etc.).
- On release, move `Unreleased` entries into a new versioned section with the real release date in `YYYY-MM-DD`.
- Keep release notes and changelog entries consistent with `.github/PULL_REQUEST_TEMPLATE.md`.
- After release, ensure `Unreleased` is reset and a new version section exists.

## Testing & Release Gates

Use confidence gates based on scope/risk:

- Quick validation: `npm run lint` and relevant `npx vitest run ...` coverage.
- Desktop pre-commit gate: `npm run build:mac` (required; see Pre-Commit Requirements).
- Release candidate gate: run both packaging builds for desktop distribution:
  - `npm run build:mac`
  - `npm run build:win`

Definition of done for meaningful changes:

- Relevant tests/builds pass for the risk level.
- No lint/build failures.
- UI-impacting changes include visual evidence or clear verification notes in the PR.

## Release Checklist

Before finalizing a release:

- Update `package.json` version using SemVer (`major.minor.patch`) as appropriate.
- Update `CHANGELOG.md` under `Unreleased`, then cut a versioned section on release.
- Ensure release artifacts are clean (use `npm run clean:release` or build scripts that invoke it).
- Produce both macOS and Windows artifacts before the final release commit:
  - `npm run build:mac`
  - `npm run build:win`
- Verify the release output in `release/` contains expected installers/artifacts.
- If using GitHub release flow, tag and publish after validations.

## Conflict Resolution Rules

When instructions overlap, apply this precedence:

1. Project-specific commands and technical details in this `CLAUDE.md`.
2. Existing commit message format and repository conventions already defined here.
3. Imported release-process guidance (PR/release/changelog discipline) from other project templates.

If a direct conflict exists, preserve this file's original project-specific behavior and adapt the imported process accordingly.

## Pre-Commit Requirements

**Before every commit, you MUST run `npm run build:mac` and verify it succeeds.** Do not commit if the Electron build fails. Fix any TypeScript errors, lint issues, or build failures first. This ensures the desktop app is always in a buildable state.

## GitHub Push Requirement

When the task is to "commit changes" (or equivalent), do not stop at a local git commit. After committing, you MUST push the commit to the repository's GitHub remote unless the user explicitly asks for a local-only commit.

## Release Cleanliness And Data Safety

Release artifacts in `release/` must stay clean. Before every Electron packaging build (`build:electron`, `build:mac`, `build:win`, `build:linux`), clear old release artifacts so only the latest build outputs remain.

Data safety is mandatory: never delete or modify user data directories (for example app data under `~/Library/Application Support`, `%APPDATA%`, `~/.config`, or any exported/imported user files) when cleaning releases.

## Commit Message Style

Write detailed, structured commit messages. Follow this format:

```
<type>(<scope>): <short summary>

<detailed description explaining WHY the change was made, not just what changed>

Changes:
- <specific change 1 with file path and what was modified>
- <specific change 2 with file path and what was modified>
- ...

<optional: context about trade-offs, alternatives considered, or follow-up needed>

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>
```

Types: `feat`, `fix`, `refactor`, `docs`, `style`, `test`, `chore`, `ci`
Scopes: `electron`, `ui`, `store`, `gpa`, `analytics`, `planner`, `timetable`, `goals`, `predictions`, `build`

Commit granularity expectations:

- One logical change per commit.
- Commit completed feature slices promptly after validation.
- Do not batch unrelated changes in one commit.

Example:
```
feat(electron): add window drag region and traffic light clearance

The Electron app uses hiddenInset titlebar for a clean macOS look, but
this removed the native drag area making the window unmovable. Users
could not reposition the app window after launch.

Changes:
- src/components/layout/Header.tsx: added invisible drag overlay div with
  88px left padding to clear macOS traffic lights (close/minimize/maximize)
- src/index.css: added -webkit-app-region: drag/no-drag rules so interactive
  elements (buttons, inputs, links) remain clickable within the drag zone

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>
```
