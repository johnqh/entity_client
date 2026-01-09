# Entity Client

React client library for entity/organization management with TanStack Query hooks.

**npm**: `@sudobility/entity_client`

## Tech Stack

- **Language**: TypeScript
- **Runtime**: Bun
- **Data Fetching**: TanStack Query v5
- **Build**: TypeScript compiler (dual ESM/CJS)
- **Test**: bun:test

## Project Structure

```
src/
├── index.ts          # Public exports
├── hooks/            # TanStack Query hooks
│   ├── index.ts      # Hook exports
│   ├── useEntities.ts    # Entity list/CRUD
│   ├── useMembers.ts     # Member management
│   └── useInvitations.ts # Invitation handling
└── network/          # HTTP client utilities
    ├── index.ts
    └── EntityClient.ts   # API client
```

## Commands

```bash
bun run build        # Build ESM + CJS to dist/
bun run clean        # Remove dist/
bun run typecheck    # TypeScript check
bun run lint         # Run ESLint
bun run lint:fix     # Fix lint issues
bun run format       # Format with Prettier
bun test             # Run tests
```

## Hooks

| Hook | Purpose |
|------|---------|
| `useEntities` | List user's entities (personal + orgs) |
| `useEntity` | Single entity details |
| `useMembers` | List and manage entity members |
| `useInvitations` | Create and manage invitations |

## Usage

```typescript
import { useEntities, useMembers } from '@sudobility/entity_client';

// List user's entities
const { data: entities, isLoading } = useEntities(userId, token);

// Manage members
const { data: members } = useMembers(entityId, token);
const { mutate: addMember } = useAddMember();
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/entities` | List user's entities |
| POST | `/entities` | Create organization |
| GET | `/entities/:slug` | Get entity details |
| GET | `/entities/:slug/members` | List members |
| POST | `/entities/:slug/members` | Add member |
| POST | `/entities/:slug/invitations` | Create invitation |

## Peer Dependencies

Required in consuming app:
- `react` >= 18.0.0
- `@tanstack/react-query` >= 5.0.0
- `@sudobility/types` - Common types

## Publishing

```bash
bun run build        # Build first
npm publish          # Publish to npm
```

## Architecture

```
entity_client (this package)
    ↑
entity_pages (page containers)
    ↑
shapeshyft_app (frontend)
```

## Code Patterns

### Query Keys
```typescript
// Consistent query key structure
['entities', userId]
['entities', entitySlug]
['entities', entitySlug, 'members']
['entities', entitySlug, 'invitations']
```

### Optimistic Updates
```typescript
// Members and invitations use optimistic updates
// for responsive UI
```
