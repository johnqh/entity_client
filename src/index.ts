/**
 * @fileoverview Entity Client Library
 * @description Frontend client and React hooks for entity/organization management
 *
 * @example
 * ```typescript
 * import {
 *   EntityClient,
 *   useEntities,
 *   useCurrentEntity,
 *   CurrentEntityProvider,
 * } from '@sudobility/entity_client';
 *
 * // Create client
 * const client = new EntityClient({
 *   baseUrl: 'https://api.example.com/api/v1',
 *   networkClient: myNetworkClient,
 * });
 *
 * // Use in React component
 * function EntityList() {
 *   const { data: entities, isLoading } = useEntities(client);
 *   // ...
 * }
 * ```
 */

// Network exports
export {
  EntityClient,
  type EntityClientConfig,
  type ApiResponse,
} from './network';

// Hook exports
export {
  // Entity hooks
  useEntities,
  useEntity,
  useCreateEntity,
  useUpdateEntity,
  useDeleteEntity,
  entityKeys,
  // Member hooks
  useEntityMembers,
  useUpdateMemberRole,
  useRemoveMember,
  memberKeys,
  // Invitation hooks
  useMyInvitations,
  useEntityInvitations,
  useCreateInvitation,
  useCancelInvitation,
  useAcceptInvitation,
  useDeclineInvitation,
  invitationKeys,
  // Context
  useCurrentEntity,
  useCurrentEntityOptional,
  CurrentEntityProvider,
  type CurrentEntityContextValue,
  type CurrentEntityProviderProps,
  type AuthUser,
} from './hooks';

// Error types
export { EntityErrorCode, type EntityApiError } from './types';

// Re-export types for convenience
export type {
  Entity,
  EntityWithRole,
  EntityMember,
  EntityInvitation,
  EntityType,
  EntityRole,
  InvitationStatus,
  EntityPermissions,
  CreateEntityRequest,
  UpdateEntityRequest,
  InviteMemberRequest,
  UpdateMemberRoleRequest,
} from '@sudobility/types';
