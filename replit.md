# Rusty Fog (Ржавый Туман)

A political sandbox game set in a post-apocalyptic Vladivostok. Players act as a "Fixer" — a faction leader who creates jobs for autonomous NPC agents on a real map of the city.

## Run & Operate

- `npm run dev` — start Vite dev server on port 5000
- `npm run build` — build for production (output: `dist/`)

## Stack

- React 19 + TypeScript + Vite 8
- Redux Toolkit for game state
- Leaflet + React-Leaflet for map display
- A* pathfinding in pure TypeScript

## Where things live

- `src/core/` — game logic (graph, agents, jobs) — no UI deps
- `src/state/` — Redux store and slices
- `src/services/GameService.ts` — game loop, movement animation
- `src/ui/` — React components, pages, styles
- `src/assets/maps/snow_valley.json` — navigation graph for Snegovaya Pad (MVP)

## Architecture decisions

- Game loop runs via `setInterval` (200ms ticks); movement animation runs on `requestAnimationFrame` — decoupled for smooth rendering
- Redux state is the single source of truth; services dispatch actions, never mutate state directly
- Graph stored as JSON with nodes (lat/lng) and edges (length, baseSpeed, state)
- MVP uses static graph (all edges intact, state=0), with edge state infrastructure already in place for v0.4+
- LLM integration (WebLLM) is not yet wired; fallback events system designed for v0.5

## Product

- **v0.1 MVP**: Map of Vladivostok (Snegovaya Pad area), 2 NPC agents, delivery jobs, resource panel, event log
- Agents autonomously pick pending jobs, pathfind via A*, and travel across the map in real time
- Player creates delivery jobs with resource rewards; agents auto-assign and complete them

## User preferences

_None yet_

## Gotchas

- `Object.values(state.x)` in `useAppSelector` must be done outside the selector to avoid Redux memoization warnings
- Leaflet CSS must be loaded from CDN in `index.html` (not importable in the usual way with Vite without extra config)
- GameService uses module-level state (interval/RAF IDs) — only one instance should run at a time

## Pointers

- Architecture doc: `docs/arch.md`
- Game design doc: `docs/disdoc.md`
- Lore / story: `docs/Ржавый туман.md`
