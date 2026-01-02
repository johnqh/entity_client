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
 *   getAuthToken: async () => firebase.currentUser?.getIdToken() ?? null,
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
  CurrentEntityProvider,
  type CurrentEntityContextValue,
  type CurrentEntityProviderProps,
} from './hooks';

// Re-export types for convenience
export type {
  Entity,
  EntityWithRole,
  EntityMember,
  EntityMemberUser,
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
