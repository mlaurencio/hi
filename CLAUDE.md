# CLAUDE.md

## Project Overview

**Thinfinity Architect** is an interactive IT infrastructure design tool powered by Google Gemini AI. It provides a visual node-and-edge diagram editor for designing Thinfinity-based infrastructure deployments, with AI-assisted architecture generation from natural language prompts.

The app is built as a Google AI Studio application and lives entirely within the `thinfinity-architect/` directory.

## Repository Structure

```
hi/
├── CLAUDE.md                          # This file
├── Welcome file.md                    # StackEdit template (not project-related)
└── thinfinity-architect/              # Main application
    ├── index.html                     # HTML entry point (loads Tailwind via CDN)
    ├── index.tsx                      # React root mount + ResizeObserver error suppression
    ├── App.tsx                        # Main application component (~850 lines)
    ├── types.ts                       # Shared TypeScript type definitions
    ├── vite.config.ts                 # Vite dev server & build configuration
    ├── tsconfig.json                  # TypeScript compiler options
    ├── package.json                   # Dependencies and scripts
    ├── metadata.json                  # AI Studio app metadata
    ├── README.md                      # Basic setup instructions
    ├── components/
    │   ├── NodeTypes.tsx              # 6 custom ReactFlow node components
    │   └── PipeEdge.tsx               # Custom edge component with protocol labels
    └── services/
        └── geminiService.ts           # Google Gemini API integration
```

## Tech Stack

- **Language:** TypeScript (ES2022 target, ESNext modules)
- **UI Framework:** React 19
- **Diagram Engine:** ReactFlow 11
- **Build Tool:** Vite 6
- **Styling:** Tailwind CSS (loaded via CDN in `index.html`)
- **Icons:** Lucide React
- **AI:** Google GenAI SDK (`@google/genai`) using `gemini-3-pro-preview` model

## Development Commands

All commands must be run from the `thinfinity-architect/` directory:

```bash
npm install          # Install dependencies
npm run dev          # Start dev server on http://localhost:3000
npm run build        # Production build
npm run preview      # Preview production build
```

## Environment Setup

Create a `.env.local` file in `thinfinity-architect/` with:

```
GEMINI_API_KEY=<your-google-gemini-api-key>
```

Vite injects this as both `process.env.API_KEY` and `process.env.GEMINI_API_KEY` (see `vite.config.ts`).

## Architecture & Key Patterns

### Component Hierarchy

`App.tsx` is a single large component that owns all application state. It renders:
- A header bar with branding and controls
- A collapsible sidebar with a component palette (drag-and-drop)
- A ReactFlow canvas with custom nodes and edges
- Modal dialogs for connection and component configuration
- A properties panel for the selected node/edge

### Node Types (components/NodeTypes.tsx)

Six custom ReactFlow node types, each with four-sided connection handles:

| Node Type       | Key           | Purpose                                      |
|-----------------|---------------|----------------------------------------------|
| `UserNode`      | `userNode`    | User endpoints (Windows, Android, PWA)        |
| `GatewayNode`   | `gatewayNode` | Security/gateway entry points                 |
| `BrokerNode`    | `brokerNode`  | Connection brokers / central hubs             |
| `ResourceNode`  | `resourceNode`| Servers, VDI clusters, application servers    |
| `HubNode`       | `hubNode`     | Virtual Connectors (routing, bus backbone)    |
| `GroupNode`     | `groupNode`   | Container/zone boundaries (resizable)         |

### Edge Type (components/PipeEdge.tsx)

Single custom edge type `pipe` renders smooth-step paths with inline labels showing protocol (HTTPS, HTTP, RDP, VNC) and direction (inbound, outbound, bidirectional, sync).

### AI Service (services/geminiService.ts)

Two exported functions:
- `generateArchitecture(prompt, currentState?)` — Generates or refactors architecture via Gemini
- `optimizeArchitecture(currentState)` — Wrapper that triggers layout optimization

The Gemini response is constrained to a JSON schema matching `DiagramState` (nodes + edges). The service applies a "Bus Architecture" system instruction where `hubNode` elements act as virtual connectors with strict routing rules (right-side input, left-side output).

### Type System (types.ts)

Key types:
- `ComponentType` enum — 9 infrastructure component types
- `ConnectionDirection` — `'inbound' | 'outbound' | 'bidirectional' | 'sync'`
- `ResourceType`, `ExecutionType`, `OSType` — Resource configuration enums
- `ResourceSpecs` — `{ cpu, ram, diskC, diskD }`
- `NodeData`, `DiagramNode`, `DiagramEdge`, `DiagramState` — Core data model interfaces

### State Management

- React hooks only (`useState`, `useCallback`, `useEffect`, `useMemo`)
- ReactFlow's `useNodesState` and `useEdgesState` for diagram state
- No external state management library

### Handle Positioning

`calculateBestHandles()` in `App.tsx` dynamically computes the best source/target handle positions based on relative node positions. Hub nodes enforce right-side input (`r-target`) and left-side output (`l-source`).

### Node Validation

`validateNodes()` in `App.tsx` ensures parent-child relationships are correct — child nodes with a `parentId` referencing a non-existent parent get their `parentId` cleared.

## Conventions

- **Single-file main component:** `App.tsx` contains the bulk of the application logic including all modals, sidebar, and canvas rendering
- **No tests or linting:** The project has no test framework, ESLint, or Prettier configured
- **No CI/CD:** No GitHub Actions or other pipeline configuration
- **Tailwind inline classes:** All styling uses Tailwind utility classes in JSX `className` attributes
- **Color palette:** Primary blue (`blue-500/600`), dark backgrounds (`slate-900`), accents in indigo, emerald, rose, and orange
- **Path aliases:** `@/*` resolves to the project root (configured in both `tsconfig.json` and `vite.config.ts`)
- **ES modules:** The project uses `"type": "module"` in `package.json`

## Important Notes for AI Assistants

1. **All source code is under `thinfinity-architect/`** — the repo root only has `CLAUDE.md` and an unrelated `Welcome file.md`
2. **`App.tsx` is large (~850 lines)** — read it fully before making changes; most UI and logic lives here
3. **No test suite exists** — verify changes by ensuring `npm run build` succeeds with no TypeScript errors
4. **Gemini API key is required** — the app will not function without a valid `GEMINI_API_KEY` in `.env.local`
5. **ReactFlow node/edge types must stay in sync** — the `nodeTypes` and `edgeTypes` objects in `App.tsx` must match the exports from `components/`
6. **Hub node routing is directional** — incoming connections use `r-target` (right), outgoing use `l-source` (left); this convention is enforced in both the UI logic and the Gemini system prompt
7. **Group nodes must be ordered first** in the nodes array for ReactFlow parent-child rendering to work correctly (the Gemini service handles this in post-processing)
