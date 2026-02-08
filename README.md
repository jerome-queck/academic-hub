# Academic Hub

A desktop and web application built for Nanyang Technological University (NTU) students to track modules, calculate GPA, plan future courses, and monitor academic progress throughout their degree.

## Why This App?

NTU students often rely on spreadsheets or manual calculations to track their GPA across 4 years and 8 semesters. This app automates that process and provides tools to plan ahead — answering questions like "What grade do I need in my remaining modules to hit First Class Honours?" or "Am I on track for Dean's List this semester?"

## Features

### Module Management
Full CRUD interface for all your NTU modules. Add modules with their code, name, AU (Academic Units), grade, type (Core, BDE, UE, FYP, etc.), and semester placement. Edit inline directly in the table, bulk-select modules to move or delete, and filter/sort by any column.

### Dashboard
At-a-glance overview of your academic standing. Shows cumulative GPA, current year GPA, and current semester GPA — both official (completed modules only) and projected (including in-progress modules with expected grades). Includes AU progress, honours classification, and a module summary table for the selected semester. Navigate between all 8 semesters (Y1S1 through Y4S2) with the period selector.

### Analytics
Visual charts and trackers powered by Recharts:
- **GPA Trend** — cumulative and semester GPA plotted across all semesters
- **Grade Distribution** — breakdown of how many A's, B's, C's, etc. you've earned
- **AU Progress** — track completed vs remaining AU against the 130 AU degree target
- **Dean's List Tracker** — shows which semesters qualify (GPA >= 4.5 with >= 15 graded AU)
- **Cumulative vs Semester Comparison** — side-by-side GPA comparison
- **Workload Analysis** — AU load per semester
- **Graduation Readiness** — overall progress toward degree completion

### Course Planner
Plan modules for future semesters before they begin. Add planned modules with prerequisite codes, and the app validates whether prerequisites are satisfied by your completed modules. When the semester starts, batch-convert planned modules into actual modules with a single action.

### Predictions
Two calculators to help you plan your grades:
- **Required Grade Calculator** — given a target CGPA, calculates what grades you need in your remaining modules to reach it
- **What-If Calculator** — change grades on any module and instantly see the projected impact on your cumulative GPA

### Goal Setting
Set a target CGPA and optional per-semester GPA goals. The goal dashboard tracks your progress, shows whether you're on track / at risk / critical, and calculates the GPA you need in remaining semesters to hit your target.

### Timetable
Weekly class schedule view. Add lectures, tutorials, labs, and seminars with day, time, venue, and module association. Entries are color-coded by module for easy visual scanning.

### Additional Features
- **Command Palette** — press `Cmd+K` to quickly search and navigate to any view or action
- **Keyboard Shortcuts** — table navigation, undo/redo support
- **Dark Mode** — light, dark, and system-following themes
- **Data Export/Import** — backup and restore all data as JSON (native file dialogs in Electron)
- **Onboarding Flow** — guided setup for first-time users

## Tech Stack

| Category | Technology |
|----------|------------|
| Framework | React 19 + TypeScript 5.9 |
| Styling | Tailwind CSS 4 (CSS-first config) |
| State | Zustand 5 with Immer middleware, persisted to localStorage |
| Build | Vite (rolldown-vite 7.2, Rust-based bundler) |
| Desktop | Electron 40 with hidden inset titlebar (macOS native look) |
| Charts | Recharts 3 |
| Animations | Framer Motion 12 |
| Testing | Vitest 4 |
| CI/CD | GitHub Actions (auto-builds Electron on push to main) |

## Getting Started

### Prerequisites
- Node.js 20+
- npm

### Installation

```bash
git clone https://github.com/jerome-queck/gpacalculator.git
cd gpacalculator
npm install
```

### Development

```bash
# Web only (opens at http://localhost:5173)
npm run dev

# Electron + Web (concurrent Vite dev server + Electron window)
npm run dev:electron
```

### Building

```bash
# Web build → dist/
npm run build

# Electron macOS → release/ (DMG + ZIP)
npm run build:mac

# Electron Windows → release/ (NSIS installer + portable)
npm run build:win

# Electron Linux → release/ (AppImage + DEB)
npm run build:linux
```

### Testing

```bash
# Run all tests
npx vitest run

# Run a specific test file
npx vitest run src/utils/gpa.test.ts
```

## Project Structure

```
src/
├── App.tsx                  # Root component, view routing, Dashboard & Settings
├── store/index.ts           # Zustand store (all app state + actions)
├── types.ts                 # All TypeScript type definitions
├── utils/gpa.ts             # Core GPA calculation engine
├── components/
│   ├── ui/                  # Reusable primitives (Card, Button, Modal, Input, etc.)
│   ├── layout/              # MainLayout, Header (with drag region), Sidebar
│   ├── modules/             # Module table with inline editing
│   ├── analytics/           # All chart components
│   ├── goals/               # Goal setting and tracking
│   ├── predictions/         # What-If and Required Grade calculators
│   ├── planner/             # Course planner with prerequisite validation
│   ├── timetable/           # Weekly schedule view
│   └── onboarding/          # First-time user setup
├── services/                # Business logic (analytics, predictions, goals)
├── contexts/ThemeContext.tsx # Light/dark/system theme management
└── hooks/                   # Keyboard shortcuts, undo/redo, table navigation
electron/
├── main.ts                  # Electron main process (window, menus, IPC, file dialogs)
└── preload.ts               # Secure IPC bridge for renderer
```

## NTU Grading Reference

### Calculation Formula

```
CGPA = Σ (Grade Point × AU) / Σ (Total AU attempted)
```

All letter-graded courses — including F — count toward the total AU in the denominator. Only excluded grades (S/U, P/F, EX, TC, IP, LOA) are omitted from both the numerator and denominator.

### Grade Points

| Grade | Points | Grade | Points |
|-------|--------|-------|--------|
| A+/A  | 5.0    | C+    | 2.5    |
| A-    | 4.5    | C     | 2.0    |
| B+    | 4.0    | D+    | 1.5    |
| B     | 3.5    | D     | 1.0    |
| B-    | 3.0    | F     | 0.0    |

### Example Calculation

Given: Module A (3 AU, A-), Module B (3 AU, B), Module C (4 AU, F), Module D (3 AU, S)

1. Convert grades: A- = 4.5, B = 3.5, F = 0.0. **S is excluded.**
2. Weighted sum: (4.5 × 3) + (3.5 × 3) + (0.0 × 4) = 13.5 + 10.5 + 0 = **24.0**
3. Total AU: 3 + 3 + 4 = **10** (Module D excluded)
4. CGPA: 24.0 / 10 = **2.40** (Pass)

### Honours Classification

| Classification | CGPA |
|---------------|------|
| First Class Honours | >= 4.50 |
| Second Class Upper | 4.00 – 4.49 |
| Second Class Lower | 3.50 – 3.99 |
| Third Class | 3.00 – 3.49 |
| Pass | 2.00 – 2.99 |
| Academic Warning/Termination | < 2.00 |

### Dean's List
Awarded per semester when GPA >= 4.5 **and** at least 15 graded AU in that semester.

## CI/CD

GitHub Actions automatically builds the Electron macOS app on every push to `main`. When a version tag is pushed (e.g., `v1.0.1`), a GitHub Release is created with the DMG and ZIP attached.

```bash
# Create a release
git tag v1.0.1
git push origin v1.0.1
```

## License

This project is for personal/educational use.
