/**
 * @fileoverview Entity API Key Hooks
 * @description React Query hooks for entity-scoped API key management
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { EntityClient } from '../network/EntityClient';
import { entityKeys } from './useEntities';
import type {
  CreateApiKeyRequest,
  UpdateApiKeyRequest,
} from '../types/api-keys';

/**
 * Query keys for API key queries.
 */
export const apiKeyKeys = {
  all: (entitySlug: string) =>
    [...entityKeys.detail(entitySlug), 'api-keys'] as const,
  list: (entitySlug: string) =>
    [...apiKeyKeys.all(entitySlug), 'list'] as const,
};

/**
 * Hook to list an entity's API keys.
 * Secrets are never returned -- only display prefixes.
 */
export function useEntityApiKeys(
  client: EntityClient,
  entitySlug: string | null
) {
  return useQuery({
    queryKey: entitySlug ? apiKeyKeys.list(entitySlug) : ['disabled'],
    queryFn: async () => {
      if (!entitySlug) return [];
      const response = await client.listApiKeys(entitySlug);
      if (!response.success || !response.data) {
        throw new Error(response.error || 'Failed to fetch API keys');
      }
      return response.data;
    },
    enabled: !!entitySlug,
  });
}

/**
 * Hook to create an API key.
 * The mutation result carries the plaintext key -- show it once, then discard;
 * it cannot be retrieved again.
 */
export function useCreateApiKey(client: EntityClient) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      entitySlug,
      request,
    }: {
      entitySlug: string;
      request: CreateApiKeyRequest;
    }) => {
      const response = await client.createApiKey(entitySlug, request);
      if (!response.success || !response.data) {
        throw new Error(response.error || 'Failed to create API key');
      }
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: apiKeyKeys.list(variables.entitySlug),
      });
    },
  });
}

/**
 * Hook to rename an API key or toggle whether it is active.
 */
export function useUpdateApiKey(client: EntityClient) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      entitySlug,
      keyId,
      request,
    }: {
      entitySlug: string;
      keyId: string;
      request: UpdateApiKeyRequest;
    }) => {
      const response = await client.updateApiKey(entitySlug, keyId, request);
      if (!response.success || !response.data) {
        throw new Error(response.error || 'Failed to update API key');
      }
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: apiKeyKeys.list(variables.entitySlug),
      });
    },
  });
}

/**
 * Hook to permanently revoke an API key.
 */
export function useRevokeApiKey(client: EntityClient) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      entitySlug,
      keyId,
    }: {
      entitySlug: string;
      keyId: string;
    }) => {
      const response = await client.revokeApiKey(entitySlug, keyId);
      if (!response.success) {
        throw new Error(response.error || 'Failed to revoke API key');
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: apiKeyKeys.list(variables.entitySlug),
      });
    },
  });
}
