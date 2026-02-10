# Changelog

Purpose:
- Provide a single, versioned record of user-visible changes.
- Ensure PRs map cleanly to release notes.

Update rules:
- Every PR must update `Unreleased` with bullet(s) in the right section.
- On release, move `Unreleased` entries into a new version section.
- Use the actual release date (YYYY-MM-DD).
- Internal refactors should note "no user-visible changes" under `Changed`.

Source of truth:
- PR descriptions and release notes drive entries here.
- Use `.github/PULL_REQUEST_TEMPLATE.md` to keep notes consistent.

## Unreleased
### Added

### Changed

### Fixed

### Deprecated

### Removed

### Security

## 0.0.0 - 2026-02-10
### Added
- Initial public release of Academic Hub for NTU students with desktop and web support.
- Module management with inline editing, filtering, bulk actions, and semester placement.
- Dashboard with official/projected GPA, semester metrics, AU progress, and honours status.
- Analytics suite (GPA trends, grade distribution, workload, dean's list, and graduation readiness views).
- Course planner with prerequisite checks and planned-to-active conversion.
- Prediction tools including required-grade and what-if CGPA calculators.
- Goal tracking for target CGPA and per-semester trajectories.
- Weekly timetable management with module-linked scheduling.
- Data export/import, onboarding flow, keyboard shortcuts, and command palette.

### Changed
- Established release-driven workflow with PR templates, changelog discipline, and CI release checks.

### Fixed

### Deprecated

### Removed

### Security
