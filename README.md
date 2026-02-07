# NTU GPA Calculator

A desktop and web application for Nanyang Technological University (NTU) students to track modules, calculate GPA, plan courses, and monitor academic progress.

## Features

- **Module Management** — Add, edit, and delete modules with grades, AU, and status tracking
- **GPA Tracking** — Real-time official and projected GPA using NTU's 5.0 scale
- **Analytics** — GPA trends, grade distribution, Dean's List tracking, graduation readiness
- **Course Planner** — Plan future semesters with prerequisite validation
- **Predictions** — "What grade do I need?" calculator and what-if scenarios
- **Goal Setting** — Set CGPA and semester targets with progress visualization
- **Timetable** — Color-coded weekly class schedule
- **Data Portability** — Export/import JSON backups
- **Dark Mode** — System-aware theme switching

## Tech Stack

- React 19, TypeScript 5.9, Tailwind CSS 4
- Vite (rolldown-vite) for builds
- Electron 40 for desktop (macOS, Windows, Linux)
- Zustand 5 with Immer for state management
- Framer Motion for animations, Recharts for charts

## Getting Started

```bash
# Install dependencies
npm install

# Web development
npm run dev

# Electron development
npm run dev:electron
```

## Building

```bash
# Web
npm run build

# Electron (per platform)
npm run build:mac
npm run build:win
npm run build:linux
```

## NTU Grading

| Grade | Points | Grade | Points |
|-------|--------|-------|--------|
| A+/A  | 5.0    | C+    | 2.5    |
| A-    | 4.5    | C     | 2.0    |
| B+    | 4.0    | D+    | 1.5    |
| B     | 3.5    | D     | 1.0    |
| B-    | 3.0    | F     | 0.0    |

Grades S, U, P, Pass, Fail, EX, TC, IP, LOA are excluded from GPA calculation.

- **Dean's List**: Semester GPA >= 4.5 with >= 15 graded AU
- **First Class Honours**: CGPA >= 4.5
