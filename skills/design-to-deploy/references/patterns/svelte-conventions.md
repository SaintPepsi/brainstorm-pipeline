# Svelte Project Conventions

## Test File Architecture

### Page vs Component Boundary

- **Shared components** (`$lib/components/`): May have `.svelte.test.ts` unit tests. These are reusable, self-contained components worth testing in isolation.
- **Page-level route components** (`src/routes/`): Tested via E2E (Playwright `.spec.ts`) only. Never create `.svelte.test.ts` files for pages — pages are integration points, not units.

### What Gets Unit Tests

- Standalone functions and utility modules
- Business logic (stores, state machines, computed values)
- Shared UI components in `$lib/components/`
- Data transformations, parsers, validators

### What Gets E2E Tests

- Page-level route components and layouts
- User-facing workflows (navigation, forms, interactions)
- UI layout refactors that change what the user sees
- Any acceptance criterion describing user actions or visual outcomes

### When Neither Applies

- Pure UI layout refactors with no new logic and no changed user behaviour may need no new tests at all. Document the rationale.

## Third-Party Component Selectors

When the project uses a component library (bits-ui, Radix, shadcn, etc.), **read the actual rendered DOM structure** from the library's source code in `node_modules` or its documentation before planning or writing selectors. Third-party components often render wrapper elements, portals, or non-obvious `data-*` attributes that naive selectors will miss. Plan selectors based on what the component actually renders, not what you assume it renders.
