/**
 * @fileoverview Entity Member Hooks
 * @description React Query hooks for entity member management
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEntityUserId } from './entityUser';
import type { EntityRole } from '@sudobility/types';
import { EntityClient } from '../network/EntityClient';
import { entityKeys } from './useEntities';

/**
 * Query keys for member-related queries.
 */
export const memberKeys = {
  all: (userId: string | null, entitySlug: string) =>
    [...entityKeys.detail(userId, entitySlug), 'members'] as const,
  list: (userId: string | null, entitySlug: string) =>
    [...memberKeys.all(userId, entitySlug), 'list'] as const,
};

/**
 * Hook to list members of an entity.
 */
export function useEntityMembers(
  client: EntityClient,
  entitySlug: string | null
) {
  const userId = useEntityUserId();
  return useQuery({
    queryKey: entitySlug ? memberKeys.list(userId, entitySlug) : ['disabled'],
    queryFn: async () => {
      if (!entitySlug) return [];
      const response = await client.listMembers(entitySlug);
      if (!response.success || !response.data) {
        throw new Error(response.error || 'Failed to fetch members');
      }
      return response.data;
    },
    enabled: !!entitySlug,
  });
}

/**
 * Hook to update a member's role.
 */
export function useUpdateMemberRole(client: EntityClient) {
  const userId = useEntityUserId();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      entitySlug,
      memberId,
      role,
    }: {
      entitySlug: string;
      memberId: string;
      role: EntityRole;
    }) => {
      const response = await client.updateMemberRole(
        entitySlug,
        memberId,
        role
      );
      if (!response.success || !response.data) {
        throw new Error(response.error || 'Failed to update member role');
      }
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: memberKeys.list(userId, variables.entitySlug),
      });
    },
  });
}

/**
 * Hook to remove a member from an entity.
 */
export function useRemoveMember(client: EntityClient) {
  const userId = useEntityUserId();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      entitySlug,
      memberId,
    }: {
      entitySlug: string;
      memberId: string;
    }) => {
      const response = await client.removeMember(entitySlug, memberId);
      if (!response.success) {
        throw new Error(response.error || 'Failed to remove member');
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: memberKeys.list(userId, variables.entitySlug),
      });
    },
  });
}
