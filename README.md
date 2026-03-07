# @sudobility/entity_client

React client library for entity/organization management with TanStack Query v5 hooks for CRUD operations on entities, members, and invitations.

## Installation

```bash
bun add @sudobility/entity_client
```

## Usage

```typescript
import {
  EntityClient,
  useEntities,
  useCreateEntity,
  useEntityMembers,
  useMyInvitations,
  useAcceptInvitation,
  CurrentEntityProvider,
  useCurrentEntity,
} from '@sudobility/entity_client';

const client = new EntityClient({
  baseUrl: 'https://api.example.com/api/v1',
  networkClient: myNetworkClient,
});

// In components
const { data: entities } = useEntities(client);
const createEntity = useCreateEntity(client);
```

## API

### Client

| Export | Description |
|--------|-------------|
| `EntityClient` | HTTP client wrapping authenticated fetch calls to the entity API |
| `EntityClientConfig` | Config: `{ baseUrl, networkClient }` |

### Entity Hooks

| Hook | Description |
|------|-------------|
| `useEntities(client)` | List all entities for current user |
| `useEntity(client, slug)` | Get single entity by slug |
| `useCreateEntity(client)` | Create organization (invalidates list) |
| `useUpdateEntity(client)` | Update entity (invalidates detail + list) |
| `useDeleteEntity(client)` | Delete entity (invalidates list) |

### Member Hooks

| Hook | Description |
|------|-------------|
| `useEntityMembers(client, slug)` | List members of an entity |
| `useUpdateMemberRole(client)` | Update member role |
| `useRemoveMember(client)` | Remove member from entity |

### Invitation Hooks

| Hook | Description |
|------|-------------|
| `useMyInvitations(client)` | List pending invitations for current user |
| `useEntityInvitations(client, slug)` | List invitations for an entity |
| `useCreateInvitation(client)` | Create invitation |
| `useCancelInvitation(client)` | Cancel invitation |
| `useAcceptInvitation(client)` | Accept invitation by token |
| `useDeclineInvitation(client)` | Decline invitation by token |

### Context

| Export | Description |
|--------|-------------|
| `CurrentEntityProvider` | Manages workspace/entity selection with localStorage persistence |
| `useCurrentEntity()` | Access current entity context (throws if outside provider) |
| `useCurrentEntityOptional()` | Access current entity context (returns null if outside) |

### Query Key Factories

`entityKeys`, `memberKeys`, `invitationKeys` -- for cache management.

## Development

```bash
bun run build          # Compile TypeScript to dist/
bun run build:watch    # Watch mode
bun run typecheck      # Type-check (no emit)
bun run lint           # ESLint
bun run test           # Run tests (vitest)
bun run format         # Prettier format
```

## License

BUSL-1.1
