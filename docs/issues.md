
## Known Constraints

1. **No `export const dynamic`** — incompatible with `cacheComponents: true` in `next.config.ts`
2. **Do NOT `'use cache'` for runtime-volume-dependent functions** — `listEnvironments` reads `~/.aws/config` which is a Docker runtime volume. Caching it during `next build` captures empty results. Use module-level memoization or no caching for any function that reads from mounted paths.
2. **Cloudscape in Server Components** — always causes `createContext` error; never do it
3. **Functions from Server → Client** — only Server Actions can cross this boundary
4. **Zod v4** — `z.record()` requires two args: `z.record(z.string(), z.unknown())`
5. **React 19 refs** — `createRef<T>()` returns `RefObject<T | null>`, not `RefObject<T>`
6. **revalidateTag** — requires two args in Next.js 16: `revalidateTag(tag, {})`
7. **Cloudscape Input** — controlled only; use `value` + `onChange`, never `defaultValue` or `name`
8. **usePathname in layout** — wrap `LeftMenu` and `Breadcrumbs` in `<Suspense>` to avoid prerender blocking
9. **`useResourceList` cache** — hook uses a module-level `Map` TTL cache (30 min). Initialize state with `useState(() => peekCache(...))` lazy initializer so the component renders with data on the first paint when navigating back. Never skip the lazy initializer or the first effect run will re-fetch from AWS.
10. **`'use cache'` functions are NOT callable from Client Components** — they can only be called from Server Components, other `'use cache'` functions, or Server Actions. The `useResourceList` hook therefore maintains its own browser-side TTL cache and calls `runAwsCommand` (a `'use server'` action) for misses.
11. **Do NOT add `app/loading.tsx` at the root** — it forces Next.js to unmount the page content and render the fallback Spinner on **every** navigation transition, causing a visible flicker. Put `loading.tsx` only in segments with genuinely slow data fetching (and even then, prefer targeted `<Suspense>` boundaries around the slow part of the page so the chrome stays mounted).
12. **Errors thrown from `'use cache'` functions get redacted in production** — the original `Error.name` and `Error.message` are replaced with generic strings by the time the rejection reaches the awaiter, so `isAwsNotFoundError(err)` will return `false` for what looked like a clear `ResourceNotFoundException` in dev. Always handle the AWS not-found case **inside** the cached function via `nullIfAwsNotFound(...)` and have the page treat `null` as `notFound()` (via `awaitOrNotFound`). Never rely on catching the original AWS error class after it crosses the cache boundary.

---

## Navigation & Cloudscape Links — Avoiding Flicker

Cloudscape components (`Link`, `BreadcrumbGroup`, `SideNavigation`, `TopNavigation` identity) render real `<a href="...">` elements. Without intervention, clicking them does a full browser navigation, blowing away the SPA state.

### Rules

1. **Always provide `onFollow` on every Cloudscape navigation control with an internal `href`.**
   Use the `useOnFollow()` hook for `Link`, `BreadcrumbGroup`, and `TopNavigation.identity`. The `SideNavigation` in `left-menu.tsx` has its own inline equivalent — keep it that way.

2. **`useOnFollow` MUST be `useCallback`-wrapped.**
   If the returned function gets a new reference on every render, Cloudscape detaches and re-attaches its internal click handler. During the brief reconciliation window a click can fall through to the native `<a href>` → full page reload.

3. **Do NOT add `app/loading.tsx` at the root.** See Known Constraints #11.

4. **Home page is a Server Component** (`app/page.tsx`). Interactive Cloudscape cards live in `app/_components/home-cards.tsx` (`'use client'`). Do not put `'use client'` directly in `app/page.tsx` — that would force the entire route into the client bundle and break RSC streaming.

5. **`TopNavigation` identity needs `onFollow` too** — it is easy to forget because Cloudscape's docs only show the `href`. Without it, clicking the AWS logo does a hard reload to `/`.

6. **Hooks must be called before any early return.** Common trap in `AppHeader`: `useOnFollow()` was placed below `if (!mounted) return null;` causing React error #310 ("rendered more hooks than during the previous render") on first paint.

### Correct pattern

```tsx
'use client';
import { useOnFollow } from '@/app/hooks/use-on-follow';
import { Link } from '@cloudscape-design/components';

export function MyComponent() {
  const onFollow = useOnFollow(); // memoized internally
  return <Link href="/foo" onFollow={onFollow}>Go to Foo</Link>;
}
```

### Anti-patterns to reject in code review

- `<Link href="/foo">…</Link>` without `onFollow` on any Cloudscape link/breadcrumb/nav
- `useOnFollow()` returning a fresh function (no `useCallback`)
- `app/loading.tsx` added "for safety"
- Hooks called after `if (!x) return null;` early returns
- `'use client'` at the top of `app/page.tsx` when the page has no client-side logic (move interactive parts to a `_components/` Client Component instead)

---

## Session Fixes Log

### Migration — Vite + Express → Next.js 16 App Router

| # | Problem | Fix |
|---|---------|-----|
| 1 | Build errors: Cloudscape `createContext` in Server Components | Moved all Cloudscape imports into `'use client'` components; never import Cloudscape in `page.tsx` (Server Component) |
| 2 | Serialization error: regular JS functions passed as props from Server → Client | Converted list page columns/callbacks to server actions (`'use server'`) or moved logic into dedicated `'use client'` detail components |
| 3 | Environment + region dropdowns empty; server actions received wrong env/region | Fixed cookie parsing in `env.ts` — reads Zustand's single `localaws` cookie JSON instead of legacy separate cookies |
| 4 | `dynamicIO` incompatible with Next.js 16 | Replaced with `cacheComponents: true` in `next.config.ts` |
| 5 | Cloudscape `@cloudscape-design/component-toolkit` transpile error | Added to `transpilePackages` in `next.config.ts` |
| 6 | Lambda detail page: container-image functions showed no runtime | Show `"Container Image"` label + `data.Code.ImageUri` when `Runtime` is absent |
| 7 | DynamoDB / SNS / SQS / SecretsManager detail pages: function serialization errors | Created dedicated `'use client'` detail components (`table-detail.tsx`, `topic-detail.tsx`, `queue-detail.tsx`, `secret-detail.tsx`); detail pages pass only serializable promises + server actions |
| 8 | `Date.now()` prerender error at build time (Cloudscape `AppLayout` internal) | Wrapped `<AppShell>` in `<Suspense fallback={null}>` in `app/layout.tsx` |
| 9 | `app-store.ts` calling `Date.now()` indirectly during SSR | Guarded cookie access to skip the call when `typeof window === 'undefined'` |
| 10 | Package conflicts: `date-fns-tz` vs `date-fns@4`, unused Vite/Express/AWS SDK packages | Removed `date-fns-tz`, `express`, `cors`, `react-router-dom`, unused `@aws-sdk/*` clients, `sass`, `tsx` from `package.json` |
| 11 | TypeScript errors with Cloudscape `fontStyle` props | Wrapped values in `<code>` element with CSS instead of relying on Cloudscape prop |
| 12 | Cloudscape `Input` uncontrolled usage | Rewrote all Cloudscape `Input` usage as controlled (`value` + `onChange` state) |

### CloudWatch Logs + List-page Caching

| # | Problem | Root Cause | Fix |
|---|---------|------------|-----|
| 13 | Every list page showed loading spinner on every navigation | `useResourceList` hook called `runAwsCommand` directly on every mount, bypassing the `'use cache'` layer entirely | Added module-level `Map` TTL cache (`CACHE_TTL_MS = 30 min`) in `use-resource-list.ts`; cache is keyed by `env:region:service:command:optionsJson` |
| 14 | Navigating back still flashed empty table before data appeared | `useState(false)` / `useState([])` initial values meant the first render always painted an empty state; the cache hit only applied after the effect cycle | Replaced with `useState(() => peekCache(...))` lazy initializers so state is seeded from the cache synchronously on first render — zero-paint flash, no loading spinner |
| 15 | Zustand hydration timing caused a second AWS call | On mount, `environment` was briefly `""` (persist middleware async); effect bailed early, then fired again once hydrated, hitting `setLoading(true)` before the cache check | `initKeyRef` tracks the key used for synchronous init; first effect run for the same key returns early without fetching |
| 16 | "Time ago" not showing next to Refresh button | `lastFetched` was never tracked by the hook; `RefreshButton` had the `lastFetched` prop but it was never passed | Added `lastFetched: number \| null` to `UseResourceListResult`; wired through `ResourceListPage` → `RefreshButton`; `RefreshButton` uses `DateUtils.formatDateAgo` and re-ticks every 30 s |
| 17 | S3 bucket browser page had no caching or `lastFetched` | Page used its own inline `useCallback` fetch, not the shared hook | Added `_s3Cache` module-level Map + `lastFetched` state to `app/s3/[bucketName]/[...prefix]/page.tsx` |

### Navigation Flicker Hunt

| # | Problem | Root Cause | Fix |
|---|---------|------------|-----|
| 18 | Intermittent full page reload when clicking Cloudscape breadcrumbs/links | `useOnFollow` returned a new function on every render → Cloudscape re-attached its click handler → clicks during the gap fell through to native `<a href>` | Wrapped the returned handler in `useCallback([router])` |
| 19 | Clicking the AWS logo in the top bar did a full page reload | `TopNavigation.identity` was missing `onFollow` entirely | Added `onFollow: useOnFollow()` to the identity prop |
| 20 | Every navigation flashed a Spinner ("flickering") between routes | `app/loading.tsx` existed at the root — Next.js wraps every page transition with this as the Suspense fallback, unmounting the current page on every click | Deleted `app/loading.tsx`. Page-level `<Suspense>` boundaries (e.g. ECR's `TableSkeleton`) handle granular loading without unmounting the page chrome |
| 21 | React error #310 in `AppHeader` ("rendered more hooks") | `useOnFollow()` was called after `if (!mounted) return null;` early return → hook count mismatch between first and second render | Moved `useOnFollow()` call above the early return alongside the other hooks |
| 22 | Home page was a fully client `'use client'` page | Forced the entire route into the client bundle and blocked RSC streaming patterns | Split: `app/page.tsx` is a Server Component, interactive cards moved to `app/_components/home-cards.tsx` (`'use client'`) |
| 23 | S3 bucket nested folder URLs broken (`/Support_Articles%2F/`) | `encodeURIComponent("Support_Articles/")` turned the path separator into `%2F`, producing a double-slash prefix after decode | Split prefix on `/`, encode each segment individually, join with literal `/` |
| 24 | S3 download links 400'd | Download Route Handler requires `env` and `region` query params but the link only included `bucket` and `key` | Pass `environment` and `region` through `makeColumns` and include them in the `/api/s3/download` URL |
| 25 | S3 table showed an empty row at the top of every folder | S3 returns the folder marker (0-byte object with key equal to the current prefix) and the new code did not filter it | Re-added the legacy filter: `obj.Key !== prefix \|\| obj.Size > 0` (in both the cache hit and miss paths) |
| 26 | S3 root listing 404'd (`/s3/bucket-name` with no prefix) | Required catch-all `[...prefix]` does not match an empty path | Renamed to optional catch-all `[[...prefix]]` and changed the `prefix?.length` check to handle the empty-array case correctly |
