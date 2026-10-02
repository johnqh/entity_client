/**
 * @fileoverview Entity Hooks
 * @description React Query hooks for entity management
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEntityUserId } from './entityUser';
import type {
  CreateEntityRequest,
  UpdateEntityRequest,
} from '@sudobility/types';
import { EntityClient } from '../network/EntityClient';

/**
 * Query keys for entity-related queries.
 *
 * Every key starts with the signed-in user (see `entityUser`), so one account's
 * cached answers can never be read back for another.
 */
export const entityKeys = {
  all: (userId: string | null) => ['entities', userId] as const,
  lists: (userId: string | null) =>
    [...entityKeys.all(userId), 'list'] as const,
  list: (userId: string | null) => [...entityKeys.lists(userId)] as const,
  details: (userId: string | null) =>
    [...entityKeys.all(userId), 'detail'] as const,
  detail: (userId: string | null, slug: string) =>
    [...entityKeys.details(userId), slug] as const,
};

/**
 * Hook to list all entities for the current user.
 *
 * @param client - Entity API client instance
 * @param options - Optional query options
 * @param options.enabled - Whether the query should execute (default: true)
 * @param options.userId - The user to cache under, where the caller is above
 *   the provider that would otherwise name them
 */
export function useEntities(
  client: EntityClient,
  options?: { enabled?: boolean; userId?: string | null }
) {
  const userId = useEntityUserId(options?.userId);
  return useQuery({
    queryKey: entityKeys.list(userId),
    queryFn: async () => {
      const response = await client.listEntities();
      if (!response.success || !response.data) {
        throw new Error(response.error || 'Failed to fetch entities');
      }
      return response.data;
    },
    enabled: options?.enabled ?? true,
  });
}

/**
 * Hook to get a single entity by slug.
 */
export function useEntity(client: EntityClient, entitySlug: string | null) {
  const userId = useEntityUserId();
  return useQuery({
    queryKey: entitySlug ? entityKeys.detail(userId, entitySlug) : ['disabled'],
    queryFn: async () => {
      if (!entitySlug) return null;
      const response = await client.getEntity(entitySlug);
      if (!response.success || !response.data) {
        throw new Error(response.error || 'Failed to fetch entity');
      }
      return response.data;
    },
    enabled: !!entitySlug,
  });
}

/**
 * Hook to create a new organization entity.
 */
export function useCreateEntity(client: EntityClient) {
  const userId = useEntityUserId();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (request: CreateEntityRequest) => {
      const response = await client.createEntity(request);
      if (!response.success || !response.data) {
        throw new Error(response.error || 'Failed to create entity');
      }
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: entityKeys.lists(userId) });
    },
  });
}

/**
 * Hook to update an entity.
 */
export function useUpdateEntity(client: EntityClient) {
  const userId = useEntityUserId();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      entitySlug,
      request,
    }: {
      entitySlug: string;
      request: UpdateEntityRequest;
    }) => {
      const response = await client.updateEntity(entitySlug, request);
      if (!response.success || !response.data) {
        throw new Error(response.error || 'Failed to update entity');
      }
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: entityKeys.detail(userId, variables.entitySlug),
      });
      queryClient.invalidateQueries({ queryKey: entityKeys.lists(userId) });
    },
  });
}

/**
 * Hook to delete an entity.
 */
export function useDeleteEntity(client: EntityClient) {
  const userId = useEntityUserId();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (entitySlug: string) => {
      const response = await client.deleteEntity(entitySlug);
      if (!response.success) {
        throw new Error(response.error || 'Failed to delete entity');
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: entityKeys.lists(userId) });
    },
  });
}
