# Keeper-UI AI Agent Context

This document provides context and guidelines for AI agents working on the keeper-ui codebase.

## 🎯 Project Overview

Keeper-UI is a React-based **admin interface** for managing **Apps**, **Divisions**, and **Users**. Each App has Divisions (hierarchical, with path/depth) and Users assigned to a Division within an App.

## 🛠️ Tech Stack

| Layer | Library |
|-------|---------|
| UI framework | React 19 (functional components + hooks) |
| CSS | **Tabler CSS 1.2** (Bootstrap-based — use Bootstrap utility classes) |
| Icons | `@tabler/icons-react` (re-exported from `@aviary-ui/ui`) |
| Dialogs | `@radix-ui/react-dialog`, `@radix-ui/react-alert-dialog` (via `@aviary-ui/ui`) |
| Routing | React Router DOM v7 |
| Server state | **TanStack Query v5** (`@tanstack/react-query`) |
| Forms | Manual local state + validation (pages) or RHF+Zod for new forms |
| Mocking | **MSW v2** (tests + optional dev mode) |
| Build | Vite 7 |
| Testing | Vitest + Testing Library |

> **No Tailwind.** Use Tabler/Bootstrap utility classes (`d-flex`, `gap-2`, `text-secondary`, `min-vh-100`, etc.).

## 📁 Source Structure

```
src/
  api/           auth.js · apps.js · divisions.js · users.js · thing.js (template)
  config/        nav.jsx — navigation items
  hooks/         useApps.js · useDivisions.js · useUsers.js · useThing.js (template)
  infra/
    config.js    App-specific env vars (appName, isDev)
    router/      index.jsx
  mocks/         handlers.js · server.js · browser.js
  pages/         LoginPage.jsx · DashboardPage.jsx · AppsPage.jsx · AppDetailsPage.jsx
  test/          setup.js · *.test.jsx
  index.css      Minimal Tabler overrides
  App.jsx        Provider stack
  main.jsx       Entry point — configure() + app mount
```

UI primitives (`Button`, `Card`, `Modal`, etc.), auth guards, error boundary, notification system, and theme live in `@aviary-ui/ui` and `@aviary-ui/core` — not inside this repo.

## 🧩 UI Components

**Import everything from `@aviary-ui/ui`.** There is no local `src/ui/` barrel.

```js
import {
  AppLayout,
  Button, Card, CardHeader, CardTitle, CardBody,
  Badge, Spinner, FormField, Input, Select,
  Modal, ConfirmDialog,
  IconPlus, IconEdit, IconTrash, IconEye, IconArrowLeft,
  useNotification,
  PrivateRoute,
  ErrorBoundary, ThemeProvider, NotificationProvider,
} from '@aviary-ui/ui';
```

HTTP client and storage utilities come from `@aviary-ui/core`:

```js
import { apiRequest, configure, storage } from '@aviary-ui/core';
```

## 📐 Absolute Imports

`@/` maps to `src/`. Use in all new files.

```js
import { useApps }    from '@/hooks/useApps';
import { config }     from '@/infra/config';
import { NAV_ITEMS }  from '@/config/nav';
```

## 🗺️ Routes

| Path | Page | Guard |
|------|------|-------|
| `/login` | `LoginPage` | — |
| `/dashboard` | `DashboardPage` | `PrivateRoute` |
| `/apps` | `AppsPage` | `PrivateRoute` |
| `/apps/:id` | `AppDetailsPage` | `PrivateRoute` |
| `/` | redirect → `/dashboard` or `/login` | — |

## 🌐 HTTP Layer

`configure()` from `@aviary-ui/core` — called once in `main.jsx` before app mount.

```js
configure({
  apiBase: import.meta.env.VITE_API_BE_URL,
  authBase: import.meta.env.VITE_API_URL,
  refreshPath: import.meta.env.VITE_REFRESH_PATH ?? '/users/refresh',
});
```

- `apiRequest(path, opts)` — authenticated API calls (attaches Bearer token).
- **Refresh token**: on 401, silently refreshes, retries original request. Falls back to `/login` if refresh fails.

## 🔑 Auth Storage

`storage` from `@aviary-ui/core`:
- `storage.getToken()` / `setToken()` — access token.
- `storage.getRefreshToken()` / `setRefreshToken()` — refresh token.
- `storage.getUser()` / `setUser()` — parsed user object.
- `storage.clear()` — clears all three.

## 🛡️ Auth Guards

```jsx
import { PrivateRoute } from '@aviary-ui/ui';

<PrivateRoute><Dashboard /></PrivateRoute>
```

No `PublicRoute` guard on login — it is a bare route.

## 🔁 TanStack Query — Data Fetching Pattern

**All server state goes through TanStack Query. No manual `useState` + `useEffect` for fetching.**

```js
// Query (read)
const { data, isLoading, error } = useQuery({
  queryKey: [RESOURCE_KEY],
  queryFn: fetchResource,
  select: (res) => res.data ?? [],
});

// Mutation (write)
const mutation = useMutation({
  mutationFn: (payload) => createResource(payload),
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: [RESOURCE_KEY] });
    showNotification('Created!', 'success');
  },
  onError: (err) => showNotification(err.message, 'error'),
});
```

Export the key constant from the hook file: `export const APPS_KEY = 'apps'`.

Global config in `App.jsx`: `staleTime: 30_000` (30s fresh window), `retry: 1`.

Hook return shape (all hooks follow this pattern):

```js
return { items, isLoading, error, refetch, create, update, remove };
```

- `useApps()` / `useApp(id)` — list or single app.
- `useDivisions(appId)` — divisions filtered by `app_id`.
- `useUsers(appId)` — users filtered by `app_id`.

## 📋 Forms

Existing pages (`AppsPage`, `AppDetailsPage`) use **local state + manual validation** (not RHF). For **new forms**, use RHF + Zod:

```js
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';

const schema = z.object({
  name: z.string().min(1, 'Required'),
  status: z.coerce.number(),
});

const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
  resolver: zodResolver(schema),
  defaultValues: { name: '', status: 1 },
});
```

Show field errors via `<FormField error={errors.field?.message}>`.

## 🚧 Error Boundary

`ErrorBoundary` from `@aviary-ui/ui` wraps the entire app in `App.jsx`. No local ErrorBoundary component in this repo.

## 🧪 Testing

**Setup**: MSW intercepts all API calls in tests — no real network, no backend needed.

```js
// Override a handler for one test:
import { http, HttpResponse } from 'msw';
import { server } from '@/mocks/server';

server.use(
  http.get('*/apps', () => HttpResponse.json({ data: [] }))
);
```

**Hook tests** — wrap with QueryClient + NotificationProvider:
```jsx
function makeWrapper() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return ({ children }) => (
    <QueryClientProvider client={qc}>
      <NotificationProvider>{children}</NotificationProvider>
    </QueryClientProvider>
  );
}
const { result } = renderHook(() => useApps(), { wrapper: makeWrapper() });
await waitFor(() => expect(result.current.isLoading).toBe(false));
```

**Mock dev mode** (no backend): set `VITE_MOCK_API=true` in `.env.development`.

## 🎨 Theme

Light/dark toggle via `ThemeProvider` from `@aviary-ui/ui`. `data-bs-theme` attribute on `<html>` drives Tabler's theme.

## 📝 Coding Standards

- **Naming**: PascalCase for components, camelCase for variables/functions.
- **Imports**: use `@/` absolute imports for local files; `@aviary-ui/ui` and `@aviary-ui/core` for shared library.
- **No local `src/ui/` barrel** — import directly from `@aviary-ui/ui`.
- **Formatting**: `make format` (Prettier) and `make lint` (ESLint) before committing.
- **Modals**: toggle `document.body.style.overflow` (`hidden`/`auto`) if background scroll bleeds through.
- **Notifications**: `useNotification()` from `@aviary-ui/ui` → `showNotification(message, 'success'|'error')`.
- **Data fetching**: TanStack Query hooks only; never raw `useState` + `useEffect` for server state.
- **Nav**: import `NAV_ITEMS` from `@/config/nav`; pass to `<AppLayout navItems={NAV_ITEMS} appName="Keeper">`.

## 🚀 Common Tasks

### Add a new page
1. Create `src/pages/NewPage.jsx`, wrap with `<AppLayout navItems={NAV_ITEMS} appName="Keeper">`.
2. Lazy-import in `src/infra/router/index.jsx`.
3. Add `<Route>` (wrap in `<PrivateRoute>` if auth-required).
4. Add nav link in `src/config/nav.jsx`.

### Add a new API module
1. Create `src/api/foo.js` using `apiRequest` from `@aviary-ui/core`.
2. Create `src/hooks/useFoo.js` using `useQuery` / `useMutation`.
3. Export a `FOO_KEY` constant from the hook file.
4. Add mock handlers to `src/mocks/handlers.js`.

### Add role-gated UI
Available from `@aviary-ui/ui` if needed:
```jsx
import { RequireRole, RequirePermission } from '@aviary-ui/ui';
<RequireRole role="admin"><AdminButton /></RequireRole>
<RequirePermission permission="reports:export"><ExportButton /></RequirePermission>
```

### Add a new form
Use RHF + Zod for new forms. Define schema → `useForm({ resolver: zodResolver(schema) })` → `register` inputs → `handleSubmit`. See `LoginPage.jsx` as reference.

### Data model relationships
```
App
 └── Division (has app_id, path, depth — hierarchical)
      └── User (has app_id + division_id)
```

Delete is blocked on App if it has divisions or users. Division delete is blocked if it has children or assigned users.
