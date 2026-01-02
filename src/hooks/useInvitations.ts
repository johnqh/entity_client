/**
 * @fileoverview Invitation Hooks
 * @description React Query hooks for entity invitation management
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { InviteMemberRequest } from '@sudobility/types';
import { EntityClient } from '../network/EntityClient';
import { entityKeys } from './useEntities';

/**
 * Query keys for invitation-related queries.
 */
export const invitationKeys = {
  all: ['invitations'] as const,
  myList: () => [...invitationKeys.all, 'my'] as const,
  entityList: (entitySlug: string) =>
    [...entityKeys.detail(entitySlug), 'invitations'] as const,
};

/**
 * Hook to list pending invitations for the current user.
 */
export function useMyInvitations(client: EntityClient) {
  return useQuery({
    queryKey: invitationKeys.myList(),
    queryFn: async () => {
      const response = await client.listMyInvitations();
      if (!response.success) {
        throw new Error(response.error || 'Failed to fetch invitations');
      }
      return response.data!;
    },
  });
}

/**
 * Hook to list invitations for an entity.
 */
export function useEntityInvitations(
  client: EntityClient,
  entitySlug: string | null
) {
  return useQuery({
    queryKey: entitySlug ? invitationKeys.entityList(entitySlug) : ['disabled'],
    queryFn: async () => {
      if (!entitySlug) return [];
      const response = await client.listEntityInvitations(entitySlug);
      if (!response.success) {
        throw new Error(response.error || 'Failed to fetch invitations');
      }
      return response.data!;
    },
    enabled: !!entitySlug,
  });
}

/**
 * Hook to create an invitation.
 */
export function useCreateInvitation(client: EntityClient) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      entitySlug,
      request,
    }: {
      entitySlug: string;
      request: InviteMemberRequest;
    }) => {
      const response = await client.createInvitation(entitySlug, request);
      if (!response.success) {
        throw new Error(response.error || 'Failed to create invitation');
      }
      return response.data!;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: invitationKeys.entityList(variables.entitySlug),
      });
    },
  });
}

/**
 * Hook to cancel an invitation.
 */
export function useCancelInvitation(client: EntityClient) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      entitySlug,
      invitationId,
    }: {
      entitySlug: string;
      invitationId: string;
    }) => {
      const response = await client.cancelInvitation(entitySlug, invitationId);
      if (!response.success) {
        throw new Error(response.error || 'Failed to cancel invitation');
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: invitationKeys.entityList(variables.entitySlug),
      });
    },
  });
}

/**
 * Hook to accept an invitation.
 */
export function useAcceptInvitation(client: EntityClient) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (token: string) => {
      const response = await client.acceptInvitation(token);
      if (!response.success) {
        throw new Error(response.error || 'Failed to accept invitation');
      }
    },
    onSuccess: () => {
      // Invalidate both my invitations and entity list
      queryClient.invalidateQueries({ queryKey: invitationKeys.myList() });
      queryClient.invalidateQueries({ queryKey: entityKeys.lists() });
    },
  });
}

/**
 * Hook to decline an invitation.
 */
export function useDeclineInvitation(client: EntityClient) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (token: string) => {
      const response = await client.declineInvitation(token);
      if (!response.success) {
        throw new Error(response.error || 'Failed to decline invitation');
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: invitationKeys.myList() });
    },
  });
}
