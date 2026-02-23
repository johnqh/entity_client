# Improvement Plans for @sudobility/entity_client

## Priority 1 - High Impact

### 1. Update CLAUDE.md Configuration Example
- `EntityClientConfig` now uses `networkClient: NetworkClient` not `getAuthToken`
- The current CLAUDE.md example is outdated and misleading
- Update all references to the old auth token pattern

### 2. Add Missing Export: `useRenewInvitation`
- Exported from `src/hooks/index.ts` but missing from `src/index.ts`
- Consumers can't access the hook from the top-level import
- Add re-export to main barrel file

### 3. Add Error Handling Types
- `ApiResponse` uses generic `error?: string`
- Add typed error codes for common failures (not found, unauthorized, conflict)
- Help consumers handle errors programmatically

## Priority 2 - Medium Impact

### 4. Add Optimistic Updates to Mutation Hooks
- `useCreateEntity`, `useUpdateEntity`, `useDeleteEntity` don't use optimistic updates
- Add optimistic cache updates for better UX
- Add rollback on failure

### 5. Add Pagination Support
- `useEntities` fetches all entities at once
- Add cursor-based or offset pagination for large entity lists
- Consider `useInfiniteQuery` for progressive loading

### 6. Add Retry Configuration
- Network failures silently fail
- Add configurable retry count and backoff to `EntityClient`
- Expose retry state in hooks for UI feedback

## Priority 3 - Nice to Have

### 7. Add CurrentEntity Persistence Options
- `CurrentEntityProvider` uses localStorage
- Support alternative storage backends (sessionStorage, secure storage for RN)
- Add migration support when entity slugs change

### 8. Add Query Prefetching
- Prefetch entity details when hovering over entity list items
- Improve perceived performance for entity switching
- Use TanStack Query's `prefetchQuery`

### 9. Add Audit Logging
- Track entity membership changes for compliance
- Log invitation accept/decline events
- Useful for enterprise customers
