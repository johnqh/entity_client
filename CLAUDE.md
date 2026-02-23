# entity_client - AI Development Guide

## Overview

React client library for entity/organization management that provides an HTTP API client (`EntityClient`) and a full suite of TanStack Query v5 hooks for CRUD operations on entities, members, and invitations. It also includes a React context provider (`CurrentEntityProvider`) for managing workspace/entity selection state with localStorage persistence.

- **Package**: `@sudobility/entity_client`
- **Version**: `0.0.20`
- **License**: BUSL-1.1
- **Package Manager**: Bun
- **Module Format**: ESM (`"type": "module"`)
- **Build Output**: `dist/` (ESM with `.d.ts` declarations)

## Project Structure

```
src/
├── index.ts                        # Public barrel exports (all hooks, client, types)
├── hooks/
│   ├── index.ts                    # Hook barrel exports
│   ├── useEntities.ts              # Entity CRUD hooks + entityKeys
│   ├── useEntityMembers.ts         # Member management hooks + memberKeys
│   ├── useInvitations.ts           # Invitation management hooks + invitationKeys
│   └── useCurrentEntity.tsx        # CurrentEntityProvider context + useCurrentEntity hook
└── network/
    ├── index.ts                    # Network barrel exports
    ├── EntityClient.ts             # HTTP API client class
    └── EntityClient.test.ts        # Unit tests (vitest)
```

## Key Exports

### Client Class

| Export | Type | Description |
|--------|------|-------------|
| `EntityClient` | class | HTTP client wrapping authenticated `fetch` calls to the entity API |
| `EntityClientConfig` | interface | Config: `{ baseUrl: string; networkClient: NetworkClient }` |
| `ApiResponse<T>` | interface | Standard response: `{ success: boolean; data?: T; error?: string }` |

### Entity Hooks (useEntities.ts)

| Export | Type | Description |
|--------|------|-------------|
| `useEntities(client)` | query hook | List all entities for the current user |
| `useEntity(client, slug)` | query hook | Get single entity by slug (disabled when slug is null) |
| `useCreateEntity(client)` | mutation hook | Create a new organization; invalidates entity list |
| `useUpdateEntity(client)` | mutation hook | Update entity; invalidates detail + list |
| `useDeleteEntity(client)` | mutation hook | Delete entity; invalidates entity list |
| `entityKeys` | object | Query key factory: `.all`, `.lists()`, `.list()`, `.details()`, `.detail(slug)` |

### Member Hooks (useEntityMembers.ts)

| Export | Type | Description |
|--------|------|-------------|
| `useEntityMembers(client, slug)` | query hook | List members of an entity (disabled when slug is null) |
| `useUpdateMemberRole(client)` | mutation hook | Update member role; invalidates member list |
| `useRemoveMember(client)` | mutation hook | Remove member; invalidates member list |
| `memberKeys` | object | Query key factory: `.all(slug)`, `.list(slug)` (nested under `entityKeys.detail`) |

### Invitation Hooks (useInvitations.ts)

| Export | Type | Description |
|--------|------|-------------|
| `useMyInvitations(client)` | query hook | List pending invitations for the current user |
| `useEntityInvitations(client, slug)` | query hook | List invitations for an entity (disabled when slug is null) |
| `useCreateInvitation(client)` | mutation hook | Create invitation; invalidates entity invitation list |
| `useCancelInvitation(client)` | mutation hook | Cancel invitation; invalidates entity invitation list |
| `useRenewInvitation(client)` | mutation hook | Renew expired invitation; invalidates entity invitation list |
| `useAcceptInvitation(client)` | mutation hook | Accept invitation by token; invalidates my invitations + entity list |
| `useDeclineInvitation(client)` | mutation hook | Decline invitation by token; invalidates my invitations |
| `invitationKeys` | object | Query key factory: `.all`, `.myList()`, `.entityList(slug)` |

### Context Provider (useCurrentEntity.tsx)

| Export | Type | Description |
|--------|------|-------------|
| `CurrentEntityProvider` | component | React context provider managing current entity/workspace selection |
| `useCurrentEntity()` | hook | Access current entity context (throws if outside provider) |
| `useCurrentEntityOptional()` | hook | Access current entity context (returns null if outside provider) |
| `CurrentEntityContextValue` | interface | Context shape: `currentEntity`, `entities`, `selectEntity()`, `refresh()`, `clear()`, etc. |
| `CurrentEntityProviderProps` | interface | Provider props: `client`, `children`, `user`, `defaultEntitySlug?`, `onEntityChange?` |
| `AuthUser` | interface | Minimal user interface: `{ uid: string; email?: string \| null }` |

### Re-exported Types (from @sudobility/types)

`Entity`, `EntityWithRole`, `EntityMember`, `EntityInvitation`, `EntityType`, `EntityRole`, `InvitationStatus`, `EntityPermissions`, `CreateEntityRequest`, `UpdateEntityRequest`, `InviteMemberRequest`, `UpdateMemberRoleRequest`

## Development Commands

```bash
bun run build          # Compile TypeScript to dist/ (uses tsconfig.build.json)
bun run build:watch    # Watch mode TypeScript compilation
bun run clean          # Remove dist/ directory
bun run typecheck      # Type-check without emitting (bunx tsc --noEmit)
bun run lint           # ESLint on src/
bun run lint:fix       # ESLint with auto-fix
bun run format         # Prettier format src/**/*.{ts,tsx,js,jsx,json}
bun run test           # Run tests with vitest (single run)
bun run test:watch     # Run tests with vitest (watch mode)
```

**Publishing**:
```bash
bun run build && npm publish    # prepublishOnly runs clean + build automatically
```

## Architecture / Patterns

### Dependency Injection via Client Instance

All hooks accept an `EntityClient` instance as the first argument rather than relying on a global singleton or context. This makes testing straightforward and supports multiple API environments.

```typescript
const client = new EntityClient({
  baseUrl: 'https://api.example.com/api/v1',
  networkClient: myNetworkClient,
});

const { data } = useEntities(client);
```

### Query Key Factory Pattern

Each domain uses a query key factory object for consistent, hierarchical cache management:

```typescript
entityKeys.all            // ['entities']
entityKeys.list()         // ['entities', 'list']
entityKeys.detail(slug)   // ['entities', 'detail', slug]
memberKeys.list(slug)     // ['entities', 'detail', slug, 'members', 'list']
invitationKeys.myList()   // ['invitations', 'my']
invitationKeys.entityList(slug) // ['entities', 'detail', slug, 'invitations']
```

### Automatic Cache Invalidation

Mutations automatically invalidate related queries via `onSuccess` callbacks:
- Entity create/delete invalidates entity lists
- Entity update invalidates both the detail and list queries
- Member mutations invalidate the member list for that entity
- Accepting an invitation invalidates both the user's invitation list and entity list

### CurrentEntityProvider State Machine

The `CurrentEntityProvider` manages workspace selection with this priority chain:
1. Explicitly selected slug (via `selectEntity()`)
2. Persisted slug from `localStorage` (key: `currentEntitySlug`)
3. Personal entity (entity with `entityType === EntityType.PERSONAL`)
4. First entity in the list

It automatically clears state on logout (user becomes null) and refetches on user change.

### Conditional Query Disabling

Hooks that accept a nullable `slug` parameter disable the query when slug is null by setting `enabled: false` and using a `['disabled']` placeholder query key. This prevents unnecessary API calls.

### API Response Wrapping

All `EntityClient` methods return `ApiResponse<T>` with `{ success, data?, error? }`. Hooks check `response.success` and throw errors for TanStack Query's error handling. The client returns `{ success: false, error: 'Not authenticated' }` when the auth token is null instead of throwing.

## Common Tasks

### Adding a new entity-scoped API endpoint

1. Add the method to `EntityClient` in `src/network/EntityClient.ts`
2. Add tests in `src/network/EntityClient.test.ts`
3. Create or extend a hook in `src/hooks/` using `useQuery` or `useMutation`
4. Add query keys to the appropriate key factory
5. Set up cache invalidation in `onSuccess`
6. Export from `src/hooks/index.ts` and `src/index.ts`

### Adding a new query hook

```typescript
export function useMyNewData(client: EntityClient, entitySlug: string | null) {
  return useQuery({
    queryKey: entitySlug ? myKeys.list(entitySlug) : ['disabled'],
    queryFn: async () => {
      if (!entitySlug) return [];
      const response = await client.myNewEndpoint(entitySlug);
      if (!response.success || !response.data) {
        throw new Error(response.error || 'Failed to fetch');
      }
      return response.data;
    },
    enabled: !!entitySlug,
  });
}
```

### Adding a new mutation hook

```typescript
export function useMyMutation(client: EntityClient) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (args: MyArgs) => {
      const response = await client.myMutationEndpoint(args);
      if (!response.success || !response.data) {
        throw new Error(response.error || 'Failed');
      }
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: relatedKeys.list(variables.slug) });
    },
  });
}
```

## Peer / Key Dependencies

| Dependency | Version | Purpose |
|------------|---------|---------|
| `react` | `^18.0.0 \|\| ^19.0.0` | Peer: React runtime for hooks and context |
| `@tanstack/react-query` | `^5.0.0` | Peer: Data fetching, caching, mutations |
| `@sudobility/types` | `^1.9.51` | Peer: Shared type definitions (Entity, EntityMember, etc.) |
| `typescript` | `^5.9.3` | Dev: TypeScript compiler |
| `vitest` | `^4.0.4` | Dev: Test runner |
| `eslint` | `^9.0.0` | Dev: Linting (flat config) |
| `prettier` | `^3.0.0` | Dev: Code formatting |

### TypeScript Configuration

- **Target**: ES2020
- **Module**: ESNext with `bundler` module resolution
- **JSX**: `react-jsx` (automatic runtime)
- **Strict mode**: Enabled (`strict: true`, `noUnusedLocals`, `noUnusedParameters`)
- **Build config** (`tsconfig.build.json`): Extends base, excludes test files and `__tests__/` directories

### CI/CD

Automated via GitHub Actions (`.github/workflows/ci-cd.yml`). Runs on pushes and PRs to `main`/`develop`. Uses a shared workflow from `johnqh/workflows` for unified CI/CD with public NPM publishing.
