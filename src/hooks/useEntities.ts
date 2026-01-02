/**
 * @fileoverview Entity Hooks
 * @description React Query hooks for entity management
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type {
  CreateEntityRequest,
  UpdateEntityRequest,
} from '@sudobility/types';
import { EntityClient } from '../network/EntityClient';

/**
 * Query keys for entity-related queries.
 */
export const entityKeys = {
  all: ['entities'] as const,
  lists: () => [...entityKeys.all, 'list'] as const,
  list: () => [...entityKeys.lists()] as const,
  details: () => [...entityKeys.all, 'detail'] as const,
  detail: (slug: string) => [...entityKeys.details(), slug] as const,
};

/**
 * Hook to list all entities for the current user.
 */
export function useEntities(client: EntityClient) {
  return useQuery({
    queryKey: entityKeys.list(),
    queryFn: async () => {
      const response = await client.listEntities();
      if (!response.success) {
        throw new Error(response.error || 'Failed to fetch entities');
      }
      return response.data!;
    },
  });
}

/**
 * Hook to get a single entity by slug.
 */
export function useEntity(client: EntityClient, entitySlug: string | null) {
  return useQuery({
    queryKey: entitySlug ? entityKeys.detail(entitySlug) : ['disabled'],
    queryFn: async () => {
      if (!entitySlug) return null;
      const response = await client.getEntity(entitySlug);
      if (!response.success) {
        throw new Error(response.error || 'Failed to fetch entity');
      }
      return response.data!;
    },
    enabled: !!entitySlug,
  });
}

/**
 * Hook to create a new organization entity.
 */
export function useCreateEntity(client: EntityClient) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (request: CreateEntityRequest) => {
      const response = await client.createEntity(request);
      if (!response.success) {
        throw new Error(response.error || 'Failed to create entity');
      }
      return response.data!;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: entityKeys.lists() });
    },
  });
}

/**
 * Hook to update an entity.
 */
export function useUpdateEntity(client: EntityClient) {
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
      if (!response.success) {
        throw new Error(response.error || 'Failed to update entity');
      }
      return response.data!;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: entityKeys.detail(variables.entitySlug),
      });
      queryClient.invalidateQueries({ queryKey: entityKeys.lists() });
    },
  });
}

/**
 * Hook to delete an entity.
 */
export function useDeleteEntity(client: EntityClient) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (entitySlug: string) => {
      const response = await client.deleteEntity(entitySlug);
      if (!response.success) {
        throw new Error(response.error || 'Failed to delete entity');
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: entityKeys.lists() });
    },
  });
}
