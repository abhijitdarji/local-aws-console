# AGENTS.md — Local AWS Console Conventions

This document is the authoritative reference for AI agents and human contributors working in this codebase. Always read it before making changes.

---

## Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| Framework | Next.js App Router | ^16 |
| UI library | React | ^19 |
| Types | TypeScript | ^6 |
| UI components | @cloudscape-design/components | ^3 |
| State | Zustand + persist | ^5 |
| Validation | Zod | ^4 |
| Logging | Pino | ^9 |
| Caching | Next.js `'use cache'` | built-in |
| Linting/Format | Biome 2 | ^2 |
| Runtime | Node.js | >=22 |

---

## Project Structure

All application code lives under `app/`. There is no `src/` directory — the Vite + Express layout was fully migrated to Next.js App Router.

```
.
├── app/                              # Next.js App Router (routes + shared code)
│   ├── layout.tsx                    # Root Server Component layout
│   ├── page.tsx                      # Home page (Server Component)
│   ├── error.tsx                     # Error boundary ('use client')
│   ├── not-found.tsx                 # 404 page ('use client')
│   ├── icon.svg                      # App icon
│   ├── _components/                  # Route-specific Client Components
│   │   └── home-cards.tsx            # Interactive home page cards
│   ├── api/
│   │   └── s3/download/route.ts      # Route Handler for S3 object streaming
│   ├── components/                   # Shared UI components (all 'use client')
│   │   ├── app-shell.tsx             # AppLayout wrapper
│   │   ├── app-header.tsx            # TopNavigation + env/region selectors
│   │   ├── left-menu.tsx             # SideNavigation
│   │   ├── resource-list-page.tsx    # List page shell (useResourceList)
│   │   ├── resource-detail-page.tsx  # Detail page shell (use + Suspense)
│   │   └── …                         # app-table, breadcrumbs, copy-text, etc.
│   ├── hooks/                        # Client hooks
│   │   ├── use-on-follow.ts          # Cloudscape onFollow → router.push
│   │   ├── use-form.ts               # Controlled form with validation
│   │   ├── use-favorites.ts          # Favorites CRUD wrapper
│   │   └── use-resource-list.ts      # Client-side TTL cache + runAwsCommand
│   ├── lib/
│   │   ├── dates.ts                  # Date utilities
│   │   ├── client/store/             # Zustand stores
│   │   │   ├── app-store.ts          # env + region (persisted to cookie)
│   │   │   ├── layout-store.ts       # Drawer open/close state
│   │   │   ├── notifications-store.ts
│   │   │   └── store-hydrator.tsx    # Syncs SSR env/region into Zustand
│   │   └── server/
│   │       ├── actions/              # 'use server' Server Actions
│   │       │   ├── aws.ts            # runAwsCommand (client list-page fetcher)
│   │       │   ├── revalidate.ts     # Cache invalidation helpers
│   │       │   ├── favorites.ts      # Favorites CRUD
│   │       │   ├── settings.ts       # listEnvironments (not cached)
│   │       │   └── cloudwatchlogs-actions.ts
│   │       ├── aws/                  # 'use cache' AWS fetchers (Server Components)
│   │       │   ├── cloudformation.ts
│   │       │   ├── cloudwatchlogs.ts
│   │       │   ├── dynamodb.ts
│   │       │   ├── ecr.ts
│   │       │   ├── lambda.ts
│   │       │   ├── s3.ts
│   │       │   ├── secretsmanager.ts
│   │       │   ├── sns.ts
│   │       │   └── sqs.ts
│   │       ├── aws-client-manager.ts # LRU-cached AWS SDK clients
│   │       ├── aws-result.ts         # Typed AWS command result wrapper
│   │       ├── env.ts                # Resolves env+region from cookies
│   │       ├── logger.ts             # Pino logger
│   │       └── schemas.ts            # Zod schemas + SERVICES enum
│   └── <service>/                    # One folder per AWS service (file-based routes)
│       ├── page.tsx                  # List page (Server Component)
│       ├── columns.tsx               # Column definitions — no Cloudscape imports!
│       ├── _components/              # Service-local Client Components (ECR pattern)
│       └── [id]/
│           ├── page.tsx              # Detail page (Server Component, no Cloudscape)
│           └── <name>-detail.tsx     # Detail Client Component ('use client')
│
│   Service routes: cloudformation/, cloudwatchlogs/, dynamodb/, ecr/,
│   favorites/, lambda/, s3/, secretsmanager/, sns/, sqs/
│
├── config/                           # App configuration
│   ├── default.json                  # Environment profiles (AWS SSO/local)
│   └── db.json                       # Favorites JSON database
├── docs/                             # Screenshots and documentation assets
├── public/                           # Static assets served at /
│   └── *.svg                         # Runtime icons (Lambda, AWS logo, etc.)
├── .github/workflows/main.yml        # CI pipeline
├── .husky/pre-commit                 # Git pre-commit hook
├── AGENTS.md                         # This file
├── biome.json                        # Biome lint/format config
├── docker-compose.yml
├── Dockerfile
├── next.config.ts
├── package.json
└── tsconfig.json                     # Path alias: @/* → ./*
```

---

## Server / Client Component Rules

### The Golden Rule
**Server Component files must NEVER import `@cloudscape-design/components`.**

Cloudscape uses `React.createContext` at module initialization. Importing it in a Server Component causes a build-time error.

### Correct Architecture

```
Server Component (page.tsx)
  ├── No Cloudscape imports
  ├── Calls 'use cache' fetchers → gets Promise<T>
  ├── Defines refresh Server Action (async function with 'use server')
  └── Renders → <ServiceDetail detailsPromise={p} onRefresh={refresh} />

Client Component (*-detail.tsx)  'use client'
  ├── Imports Cloudscape freely
  ├── Receives Promise via props
  ├── Uses ResourceDetailPage/ResourceListPage patterns
  └── Uses use(promise) with Suspense for streaming
```

### Column Definitions
- `columns.tsx` files must NOT import Cloudscape components (e.g. `StatusIndicator`)
- Use plain text or emoji for status values in column cell functions
- Column cell functions CAN return JSX using `next/link` (which has its own `'use client'`)

### Passing Functions
- **Server Action** (`async fn() { 'use server'; }`) → CAN be passed from Server to Client
- **Regular JS function** → CANNOT be passed from Server to Client
- **Promise<T>** → CAN be passed from Server to Client (React 19 `use()` pattern)

---

## Page Patterns

### Pattern A — List Page (Server Component)
```tsx
// app/service/page.tsx
import { resolveEnvRegion } from '@/app/lib/server/env';
import { listItems } from '@/app/lib/server/aws/service';
import { revalidateAws } from '@/app/lib/server/actions/revalidate';
import { ResourceListPage } from '@/app/components/resource-list-page';
import { serviceColumns } from './columns';

export default async function ServicePage() {
  const { env, region } = await resolveEnvRegion();
  const itemsPromise = listItems(env, region).then((d) => (d as any).Items ?? []);

  async function refresh() {
    'use server';
    await revalidateAws(env, region, 'ServiceName');
  }

  return (
    <ResourceListPage
      title="Service"
      resourceName="Resource"
      awsConsoleUrl={`https://${region}.console.aws.amazon.com/...`}
      columns={serviceColumns}
      itemsPromise={itemsPromise}
      onRefresh={refresh}
    />
  );
}
```

### Pattern B — Detail Page Split (Server Component + Client Component)
```tsx
// app/service/[id]/page.tsx  — NO Cloudscape imports
import { ServiceDetail } from './service-detail';

export default async function ServiceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { env, region } = await resolveEnvRegion();
  const detailsPromise = getItem(env, region, id);

  async function refresh() { 'use server'; await revalidateAws(env, region, 'Service'); }

  return <ServiceDetail id={id} region={region} detailsPromise={detailsPromise} onRefresh={refresh} />;
}

// app/service/[id]/service-detail.tsx  — 'use client', Cloudscape OK
'use client';
export function ServiceDetail({ id, region, detailsPromise, onRefresh }) {
  return (
    <ResourceDetailPage title={id} detailsPromise={detailsPromise} onRefresh={onRefresh} awsConsoleUrl="...">
      {(data) => <KeyValueGrid fields={[...]} />}
    </ResourceDetailPage>
  );
}
```

### Pattern C — Client-only Page (interactive, no server data)
```tsx
'use client';
// Uses useEffect + server action for data fetching
```

### Pattern D — Favorites CRUD (Server Actions + controlled Cloudscape inputs)
- Use `useState` for input values (Cloudscape `Input` is controlled, not uncontrolled)
- Call server actions directly (not via `useActionState`) for typed data

### Pattern E — S3 Stream (Route Handler)
- `app/api/s3/download/route.ts` handles streaming `GetObject` responses
- Uses `ReadableStream` with Response

---

## Server-side Caching

### AWS Read Functions (`app/lib/server/aws/*.ts`)
Every AWS read function uses `'use cache'` inline with `cacheLife` + `cacheTag`:

```ts
export async function listItems(env: string, region: string) {
  'use cache';
  cacheLife({ stale: 0, revalidate: 1800, expire: 3600 });
  cacheTag(`aws:${env}:${region}`, `aws:${env}:${region}:ServiceName`);
  return runAwsCommand({ env, region, service: 'ServiceName', command: 'ListItems', options: {} });
}
```

### Cache Tags
| Tag | Scope |
|-----|-------|
| `aws:${env}:${region}` | All AWS data for an env+region |
| `aws:${env}:${region}:Lambda` | Lambda only |
| `aws:${env}:${region}:CloudFormation` | CloudFormation only |
| `aws:${env}:${region}:SNS` | SNS only |
| `aws:${env}:${region}:SQS` | SQS only |
| `aws:${env}:${region}:CloudWatchLogs` | CloudWatch Logs only |
| `aws:${env}:${region}:DynamoDB` | DynamoDB only |
| `aws:${env}:${region}:SecretsManager` | Secrets Manager only |
| `aws:${env}:${region}:S3` | S3 only |
| `aws:${env}:${region}:ECR` | ECR only |
| `aws:${env}:${region}:IAM` | IAM only (role policy viewer) |
| `favorites` | Favorites JSON database |

### Cache Invalidation
```ts
// In a 'use server' Server Action
await revalidateAws(env, region, 'ServiceName'); // service-specific
await revalidateAws(env, region);                // all AWS data for env+region
revalidateTag('favorites', {});                  // favorites
```

### Favorites Read Functions
`getFavorites` and `getFavoriteById` use `'use cache'` with `cacheTag('favorites')` so they integrate with the standard cache invalidation flow.

---

## State Management (Zustand)

### Stores
| Store | File | Persisted |
|-------|------|-----------|
| App state (env, region) | `app-store.ts` | Cookie (sameSite=lax, 365d) |
| Layout (drawers) | `layout-store.ts` | Memory only |
| Notifications | `notifications-store.ts` | Memory only |

### Hydration
`StoreHydrator` is a `'use client'` component rendered by `app/layout.tsx` that syncs server-resolved `env` and `region` into the Zustand store on first mount. This prevents hydration mismatch between cookie and SSR values.

```tsx
// layout.tsx (Server Component)
const { env, region } = await resolveEnvRegion();
return (
  <body>
    <StoreHydrator env={env} region={region} />
    <AppShell>...</AppShell>
  </body>
);
```

---

## AWS Client Manager

`app/lib/server/aws-client-manager.ts` uses `lru-cache` with:
- `maxSize: 50` clients
- `ttl: 30 minutes`
- `dispose: client.destroy()` on eviction
- Credentials resolved from: SSO profiles → local profiles → `~/.aws/credentials`

---

## Environment & Region Resolution

`app/lib/server/env.ts` resolves `{ env, region }` from cookies in this priority:
1. Cookie `localaws` (set by Zustand persist) — `environment` and `region` keys
2. Fall back to first available environment from `config` module

---

## Hooks Policy

| Hook | Status | Notes |
|------|--------|-------|
| `use-on-follow.ts` | Keep | Wraps Next.js `router.push` for Cloudscape `onFollow` events |
| `use-form.ts` | Keep | Generic controlled form with validation and focus-on-error |
| `use-favorites.ts` | Keep | Client hook wrapping favorites server actions |
| `use-cached-data.ts` | Deleted | Replaced by Server Components + `'use cache'` |
| `use-live-data.ts` | Deleted | Replaced by `useEffect` + server actions |

---

## Logging

Server-side logging uses Pino via `app/lib/server/logger.ts`:

```ts
import { log } from '@/app/lib/server/logger';
log.info({ key: value }, 'event.name');
log.error({ err }, 'error description');
```

**Do not** use `console.log` / `console.error` in server code.

---

## Routing

Next.js file-based routes mirror the original React Router paths:

| Path | File |
|------|------|
| `/` | `app/page.tsx` |
| `/lambda` | `app/lambda/page.tsx` |
| `/lambda/:name` | `app/lambda/[functionName]/page.tsx` |
| `/cloudformation` | `app/cloudformation/page.tsx` |
| `/cloudformation/:id` | `app/cloudformation/[stackId]/page.tsx` |
| `/cloudformation/exports` | `app/cloudformation/exports/page.tsx` |
| `/sns` | `app/sns/page.tsx` |
| `/sns/:arn` | `app/sns/[topicArn]/page.tsx` |
| `/sqs` | `app/sqs/page.tsx` |
| `/sqs/:url` | `app/sqs/[queueUrl]/page.tsx` |
| `/cloudwatchlogs` | `app/cloudwatchlogs/page.tsx` |
| `/cloudwatchlogs/:group` | `app/cloudwatchlogs/[logGroupName]/page.tsx` |
| `/cloudwatchlogs/:group/:stream` | `app/cloudwatchlogs/[logGroupName]/[logStreamName]/page.tsx` |
| `/cloudwatchlogs/loginsights` | `app/cloudwatchlogs/loginsights/page.tsx` |
| `/dynamodb` | `app/dynamodb/page.tsx` |
| `/dynamodb/:table` | `app/dynamodb/[tableName]/page.tsx` |
| `/secretsmanager` | `app/secretsmanager/page.tsx` |
| `/secretsmanager/:id` | `app/secretsmanager/[secretId]/page.tsx` |
| `/s3` | `app/s3/page.tsx` |
| `/s3/:bucket/...prefix` | `app/s3/[bucketName]/[[...prefix]]/page.tsx` |
| `/ecr` | `app/ecr/page.tsx` |
| `/ecr/private` | `app/ecr/private/page.tsx` |
| `/ecr/private/:repo` | `app/ecr/private/[...repositoryName]/page.tsx` |
| `/ecr/public` | `app/ecr/public/page.tsx` |
| `/ecr/public/:repo` | `app/ecr/public/[...repositoryName]/page.tsx` |
| `/favorites` | `app/favorites/page.tsx` |
| `/favorites/add` | `app/favorites/add/page.tsx` |
| `/favorites/edit/:id` | `app/favorites/edit/[id]/page.tsx` |
| `/api/s3/download` | `app/api/s3/download/route.ts` |

---

## Adding a New AWS Service

1. Create `app/lib/server/aws/<service>.ts` with `'use cache'` fetchers and cache tags
2. Create `app/<service>/page.tsx` (Server Component, no Cloudscape)
3. Create `app/<service>/columns.tsx` (no Cloudscape imports)
4. If detail view: create `app/<service>/[id]/page.tsx` + `app/<service>/[id]/<service>-detail.tsx` ('use client')
5. Add service to the left menu in `app/components/left-menu.tsx`
6. Add service link on home page `app/_components/home-cards.tsx`
7. Add service name to `SERVICES` enum in `app/lib/server/schemas.ts`

---

## CI / CD

### GitHub Actions (`.github/workflows/main.yml`)
- Node 22 setup
- Non-trusted `uses:` references must be pinned to 40-character SHA (workspace rule)
- Trusted orgs: `actions/`, `aws-actions/`

### Docker
- Multi-stage build: `node:22-alpine` builder → runtime with Next.js standalone output
- Build args: `BUILD_TAG` for image tagging
- Output path: `.next/standalone/`

---

## Development Scripts

```bash
npm run dev        # Next.js dev server with Turbopack
npm run build      # Production build
npm run start      # Serve production build
npm run lint       # Biome lint
npm run format     # Biome format --write
npm run check      # Biome check (lint + format)
npm run check:fix  # Biome check --write (auto-fix)
```

---
