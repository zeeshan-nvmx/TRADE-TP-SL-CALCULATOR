# Technology Stack
_Generated: 2026-06-01_

## Summary
This is a client-side React 19 single-page application built with Vite 6 and styled with Tailwind CSS 3. It has no backend — all logic runs in the browser, with external data fetched from the Binance Futures REST API. There are no testing frameworks or state management libraries in the dependency tree.

## Languages

**Primary:**
- JavaScript (ES2020+) — all source files use `.js` / `.jsx` extensions; no TypeScript in use despite `@types/react` being listed as a dev dependency

**Secondary:**
- CSS — `src/index.css` for global base styles, Tailwind utility classes used inline throughout components

## Runtime

**Environment:**
- Browser only — no Node.js server runtime
- Node.js is used only for the Vite dev/build toolchain

**Package Manager:**
- npm — `package-lock.json` is present and committed

## Frameworks

**Core:**
- React `^19.0.0` (`react`, `react-dom`) — UI rendering, hooks-based state management

**Build/Dev:**
- Vite `^6.2.0` — dev server, HMR, production bundler
  - Config: `vite.config.js` (minimal — only `@vitejs/plugin-react` plugin)
- `@vitejs/plugin-react` `^4.3.4` — Babel-based JSX transform for Vite

**Styling:**
- Tailwind CSS `^3.4.17` — utility-first CSS
  - Config: `tailwind.config.js` (dark mode via `class` strategy, content glob covers `./src/**/*.{js,ts,jsx,tsx}`)
- PostCSS `^8.5.3` — required by Tailwind; config: `postcss.config.js`
- Autoprefixer `^10.4.21` — PostCSS plugin for vendor prefixes

**Testing:**
- None — no test runner, no assertion library

## Key Dependencies

**Production:**
- `react` `^19.0.0` — component model and hooks (`useState`, `useEffect`, `useCallback`)
- `react-dom` `^19.0.0` — DOM renderer; entry point `src/main.jsx` calls `ReactDOM.createRoot`

**Dev / Toolchain:**
- `eslint` `^9.21.0` — linting; flat config in `eslint.config.js`
- `eslint-plugin-react-hooks` `^5.1.0` — enforces Rules of Hooks
- `eslint-plugin-react-refresh` `^0.4.19` — warns on non-component exports that break HMR
- `globals` `^15.15.0` — browser global definitions for ESLint
- `@types/react` `^19.0.10`, `@types/react-dom` `^19.0.4` — TypeScript type definitions (present but TypeScript itself is not used)

## Configuration Files

| File | Purpose |
|------|---------|
| `vite.config.js` | Vite build config — registers `@vitejs/plugin-react` |
| `tailwind.config.js` | Tailwind content paths, dark mode strategy (`class`) |
| `postcss.config.js` | PostCSS plugins for Tailwind + Autoprefixer |
| `eslint.config.js` | Flat ESLint config — JS/JSX, react-hooks, react-refresh rules |
| `index.html` | Vite entry HTML — mounts `<div id="root">`, loads `src/main.jsx` |
| `package.json` | Project manifest; scripts: `dev`, `build`, `lint`, `preview` |

## Build Commands

```bash
npm run dev       # Start Vite dev server with HMR
npm run build     # Production bundle to dist/
npm run preview   # Serve the production build locally
npm run lint      # Run ESLint across all JS/JSX files
```

## Platform Requirements

**Development:**
- Node.js (version not pinned — no `.nvmrc` or `.node-version` file)
- npm (lockfile present)

**Production:**
- Static file hosting only — the `dist/` output is a fully static site with no server-side requirements
- No environment variables required at build time (all runtime config is hardcoded or user-provided)
