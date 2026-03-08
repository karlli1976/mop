# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Mixed Ops Practice (mop) is a math practice application that generates arithmetic problems with all four operations (+, -, *, /) in each expression. Users solve timed problem sets and track their performance over time.

## Development Commands

Requires Node.js ^20.19.0 or >=22.12.0.

```bash
npm install        # Install dependencies
npm run dev        # Start Vite dev server with HMR
npm run build      # Production build to dist/
npm run preview    # Preview production build locally
```

No test runner or linter is configured.

### Tauri Desktop App (optional)

The project includes a Tauri wrapper in `src-tauri/` for building a native desktop app:

```bash
cd src-tauri && cargo build --release
```

## Architecture

**Stack**: Vue 3 (Composition API) + Vite 7 + vanilla JavaScript (no TypeScript). Path alias `@` maps to `src/`.

**Routing**: Hash-based routing implemented in `App.vue` (no vue-router). Routes: `#/practice`, `#/fractions`, and `#/stats`. Navigation away from the active route is blocked while a session is active.

**State Management**: Simple reactive store in `src/store.js` using Vue's `reactive()`. Contains `isSessionActive` (boolean) and `activeSessionType` (`'mixed' | 'fraction' | null`), shared between `App.vue` (controls nav) and the practice views.

**Data Persistence**: Mixed ops sessions stored in localStorage under `mop:sessions`; fraction sessions under `mop:fraction-sessions`. Each entry has `{ date, timeSec, accuracy, startedAt }`.

**Session Lifecycle**: Problems are generated on mount. User clicks Start (expressions revealed, timer begins) -> answers problems -> clicks End (timer stops, results shown, session saved to localStorage). Clicking "New Set" resets.

### Key Files

- `src/utils/generator.js` - Mixed ops generation. Exports `generateSet(count)` and `formatSeconds(sec)`. Generates expressions with 5 two-digit numbers and all 4 operators. Uses a retry loop (up to 2000 attempts) with a deterministic fallback builder (`a * b / c + d - e`) to guarantee valid output.
- `src/utils/fractionGenerator.js` - Fraction problem generation. Exports `generateFractionSet(count)`, `parseFraction(input)`, `fractionsEqual(f1, f2)`, `formatFraction(f)`, and re-exports `formatSeconds`. Same retry/fallback pattern; fractions are `{ num, den }` objects kept in simplified form.
- `src/views/PracticeView.vue` - Mixed ops practice interface with timer, problem display, and answer input
- `src/views/FractionView.vue` - Fraction practice interface; answers accepted as `"n/d"` or whole numbers
- `src/views/StatsView.vue` - Historical session data with SVG-based accuracy/time charts
- `vite.config.js` - Uses `base: './'` for file:// protocol compatibility

### Problem Generation Constraints

Problems in `generator.js` must satisfy:
- Exactly one of each operator: +, -, *, /
- All operands are two-digit numbers (10-99)
- No negative numbers at any evaluation step
- All intermediate and final results are integers
- Standard operator precedence (*, / before +, -)
