/**
 * @fileoverview Tests for EntityClient
 */

import { describe, test, expect, beforeEach, vi } from 'vitest';
import { EntityClient, type EntityClientConfig } from './EntityClient';
import type { NetworkClient, NetworkResponse } from '@sudobility/types';

// Mock NetworkClient factory
function createMockNetworkClient(): NetworkClient & {
  get: ReturnType<typeof vi.fn>;
  post: ReturnType<typeof vi.fn>;
  put: ReturnType<typeof vi.fn>;
  delete: ReturnType<typeof vi.fn>;
  request: ReturnType<typeof vi.fn>;
} {
  return {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
    request: vi.fn(),
  };
}

// Mock NetworkResponse factory
function createMockResponse<T>(
  data: T,
  success = true
): NetworkResponse<{ success: boolean; data?: T; error?: string }> {
  return {
    ok: true,
    status: 200,
    statusText: 'OK',
    headers: {},
    success: true,
    data: { success, data, error: success ? undefined : 'Error' },
  };
}

function createErrorResponse(
  error: string
): NetworkResponse<{ success: boolean; error: string }> {
  return {
    ok: true,
    status: 200,
    statusText: 'OK',
    headers: {},
    success: true,
    data: { success: false, error },
  };
}

function createNetworkErrorResponse(): NetworkResponse<undefined> {
  return {
    ok: false,
    status: 500,
    statusText: 'Internal Server Error',
    headers: {},
    success: false,
    data: undefined,
  };
}

describe('EntityClient', () => {
  let client: EntityClient;
  let mockNetworkClient: ReturnType<typeof createMockNetworkClient>;
  const baseUrl = 'https://api.example.com/api/v1';

  beforeEach(() => {
    mockNetworkClient = createMockNetworkClient();
    const config: EntityClientConfig = {
      baseUrl,
      networkClient: mockNetworkClient,
    };
    client = new EntityClient(config);
  });

  // =============================================================================
  // Entity CRUD
  // =============================================================================

  describe('listEntities', () => {
    test('fetches entities list', async () => {
      const mockEntities = [
        { id: '1', entitySlug: 'abc12345', displayName: 'Test' },
      ];
      mockNetworkClient.get.mockResolvedValueOnce(
        createMockResponse(mockEntities)
      );

      const result = await client.listEntities();

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockEntities);
      expect(mockNetworkClient.get).toHaveBeenCalledWith(`${baseUrl}/entities`);
    });
  });

  describe('createEntity', () => {
    test('creates entity with request body', async () => {
      const newEntity = {
        id: '1',
        entitySlug: 'neworg12',
        displayName: 'New Org',
      };
      mockNetworkClient.post.mockResolvedValueOnce(
        createMockResponse(newEntity)
      );

      const result = await client.createEntity({
        displayName: 'New Org',
        entitySlug: 'neworg12',
      });

      expect(result.success).toBe(true);
      expect(result.data).toEqual(newEntity);
      expect(mockNetworkClient.post).toHaveBeenCalledWith(
        `${baseUrl}/entities`,
        { displayName: 'New Org', entitySlug: 'neworg12' }
      );
    });
  });

  describe('getEntity', () => {
    test('fetches entity by slug', async () => {
      const mockEntity = {
        id: '1',
        entitySlug: 'abc12345',
        displayName: 'Test',
      };
      mockNetworkClient.get.mockResolvedValueOnce(
        createMockResponse(mockEntity)
      );

      const result = await client.getEntity('abc12345');

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockEntity);
      expect(mockNetworkClient.get).toHaveBeenCalledWith(
        `${baseUrl}/entities/abc12345`
      );
    });
  });

  describe('updateEntity', () => {
    test('updates entity with request body', async () => {
      const updatedEntity = {
        id: '1',
        entitySlug: 'abc12345',
        displayName: 'Updated',
      };
      mockNetworkClient.put.mockResolvedValueOnce(
        createMockResponse(updatedEntity)
      );

      const result = await client.updateEntity('abc12345', {
        displayName: 'Updated',
      });

      expect(result.success).toBe(true);
      expect(result.data).toEqual(updatedEntity);
      expect(mockNetworkClient.put).toHaveBeenCalledWith(
        `${baseUrl}/entities/abc12345`,
        { displayName: 'Updated' }
      );
    });
  });

  describe('deleteEntity', () => {
    test('deletes entity by slug', async () => {
      mockNetworkClient.delete.mockResolvedValueOnce(
        createMockResponse(undefined)
      );

      const result = await client.deleteEntity('abc12345');

      expect(result.success).toBe(true);
      expect(mockNetworkClient.delete).toHaveBeenCalledWith(
        `${baseUrl}/entities/abc12345`
      );
    });
  });

  // =============================================================================
  // Member Management
  // =============================================================================

  describe('listMembers', () => {
    test('fetches members list for entity', async () => {
      const mockMembers = [{ id: 'm1', userId: 'u1', role: 'manager' }];
      mockNetworkClient.get.mockResolvedValueOnce(
        createMockResponse(mockMembers)
      );

      const result = await client.listMembers('abc12345');

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockMembers);
      expect(mockNetworkClient.get).toHaveBeenCalledWith(
        `${baseUrl}/entities/abc12345/members`
      );
    });
  });

  describe('updateMemberRole', () => {
    test('updates member role', async () => {
      const updatedMember = { id: 'm1', userId: 'u1', role: 'manager' };
      mockNetworkClient.put.mockResolvedValueOnce(
        createMockResponse(updatedMember)
      );

      const result = await client.updateMemberRole(
        'abc12345',
        'm1',
        'manager' as any
      );

      expect(result.success).toBe(true);
      expect(result.data).toEqual(updatedMember);
      expect(mockNetworkClient.put).toHaveBeenCalledWith(
        `${baseUrl}/entities/abc12345/members/m1`,
        { role: 'manager' }
      );
    });
  });

  describe('removeMember', () => {
    test('removes member from entity', async () => {
      mockNetworkClient.delete.mockResolvedValueOnce(
        createMockResponse(undefined)
      );

      const result = await client.removeMember('abc12345', 'm1');

      expect(result.success).toBe(true);
      expect(mockNetworkClient.delete).toHaveBeenCalledWith(
        `${baseUrl}/entities/abc12345/members/m1`
      );
    });
  });

  // =============================================================================
  // Invitation Management
  // =============================================================================

  describe('listEntityInvitations', () => {
    test('fetches invitations for entity', async () => {
      const mockInvitations = [{ id: 'i1', email: 'test@example.com' }];
      mockNetworkClient.get.mockResolvedValueOnce(
        createMockResponse(mockInvitations)
      );

      const result = await client.listEntityInvitations('abc12345');

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockInvitations);
      expect(mockNetworkClient.get).toHaveBeenCalledWith(
        `${baseUrl}/entities/abc12345/invitations`
      );
    });
  });

  describe('createInvitation', () => {
    test('creates invitation with request body', async () => {
      const newInvitation = {
        id: 'i1',
        email: 'new@example.com',
        role: 'viewer',
      };
      mockNetworkClient.post.mockResolvedValueOnce(
        createMockResponse(newInvitation)
      );

      const result = await client.createInvitation('abc12345', {
        email: 'new@example.com',
        role: 'viewer' as any,
      });

      expect(result.success).toBe(true);
      expect(result.data).toEqual(newInvitation);
      expect(mockNetworkClient.post).toHaveBeenCalledWith(
        `${baseUrl}/entities/abc12345/invitations`,
        { email: 'new@example.com', role: 'viewer' }
      );
    });
  });

  describe('cancelInvitation', () => {
    test('cancels invitation', async () => {
      mockNetworkClient.delete.mockResolvedValueOnce(
        createMockResponse(undefined)
      );

      const result = await client.cancelInvitation('abc12345', 'i1');

      expect(result.success).toBe(true);
      expect(mockNetworkClient.delete).toHaveBeenCalledWith(
        `${baseUrl}/entities/abc12345/invitations/i1`
      );
    });
  });

  describe('listMyInvitations', () => {
    test('fetches pending invitations for current user', async () => {
      const mockInvitations = [{ id: 'i1', email: 'me@example.com' }];
      mockNetworkClient.get.mockResolvedValueOnce(
        createMockResponse(mockInvitations)
      );

      const result = await client.listMyInvitations();

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockInvitations);
      expect(mockNetworkClient.get).toHaveBeenCalledWith(
        `${baseUrl}/invitations`
      );
    });
  });

  describe('acceptInvitation', () => {
    test('accepts invitation by token', async () => {
      mockNetworkClient.post.mockResolvedValueOnce(
        createMockResponse(undefined)
      );

      const result = await client.acceptInvitation('token123');

      expect(result.success).toBe(true);
      expect(mockNetworkClient.post).toHaveBeenCalledWith(
        `${baseUrl}/invitations/token123/accept`,
        undefined
      );
    });
  });

  describe('declineInvitation', () => {
    test('declines invitation by token', async () => {
      mockNetworkClient.post.mockResolvedValueOnce(
        createMockResponse(undefined)
      );

      const result = await client.declineInvitation('token123');

      expect(result.success).toBe(true);
      expect(mockNetworkClient.post).toHaveBeenCalledWith(
        `${baseUrl}/invitations/token123/decline`,
        undefined
      );
    });
  });

  // =============================================================================
  // Error Handling
  // =============================================================================

  describe('error handling', () => {
    test('handles network errors', async () => {
      mockNetworkClient.get.mockRejectedValueOnce(new Error('Network error'));

      const result = await client.listEntities();

      expect(result.success).toBe(false);
      expect(result.error).toBe('Network error');
    });

    test('handles failed network responses', async () => {
      mockNetworkClient.get.mockResolvedValueOnce(createNetworkErrorResponse());

      const result = await client.getEntity('notfound');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Request failed');
    });

    test('handles API error responses', async () => {
      mockNetworkClient.get.mockResolvedValueOnce(
        createErrorResponse('Not found')
      );

      const result = await client.getEntity('notfound');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Not found');
    });
  });

  // =============================================================================
  // API Keys
  // =============================================================================

  describe('listApiKeys', () => {
    test('fetches keys for an entity', async () => {
      const mockKeys = [
        { id: 'key-1', keyName: 'CI', keyPrefix: 'shyft_a1b2c3' },
      ];
      mockNetworkClient.get.mockResolvedValueOnce(createMockResponse(mockKeys));

      const result = await client.listApiKeys('abc12345');

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockKeys);
      expect(mockNetworkClient.get).toHaveBeenCalledWith(
        `${baseUrl}/entities/abc12345/api-keys`
      );
    });
  });

  describe('createApiKey', () => {
    test('creates a key and returns the plaintext secret', async () => {
      const created = { id: 'key-1', keyName: 'CI', key: 'shyft_secret' };
      mockNetworkClient.post.mockResolvedValueOnce(createMockResponse(created));

      const result = await client.createApiKey('abc12345', {
        key_name: 'CI',
      });

      expect(result.success).toBe(true);
      expect(result.data?.key).toBe('shyft_secret');
      expect(mockNetworkClient.post).toHaveBeenCalledWith(
        `${baseUrl}/entities/abc12345/api-keys`,
        { key_name: 'CI' }
      );
    });
  });

  describe('updateApiKey', () => {
    test('renames a key', async () => {
      mockNetworkClient.put.mockResolvedValueOnce(
        createMockResponse({ id: 'key-1', keyName: 'Renamed' })
      );

      const result = await client.updateApiKey('abc12345', 'key-1', {
        key_name: 'Renamed',
      });

      expect(result.success).toBe(true);
      expect(mockNetworkClient.put).toHaveBeenCalledWith(
        `${baseUrl}/entities/abc12345/api-keys/key-1`,
        { key_name: 'Renamed' }
      );
    });

    test('deactivates a key', async () => {
      mockNetworkClient.put.mockResolvedValueOnce(
        createMockResponse({ id: 'key-1', isActive: false })
      );

      await client.updateApiKey('abc12345', 'key-1', { is_active: false });

      expect(mockNetworkClient.put).toHaveBeenCalledWith(
        `${baseUrl}/entities/abc12345/api-keys/key-1`,
        { is_active: false }
      );
    });
  });

  describe('revokeApiKey', () => {
    test('deletes a key by id', async () => {
      mockNetworkClient.delete.mockResolvedValueOnce(
        createMockResponse(undefined)
      );

      const result = await client.revokeApiKey('abc12345', 'key-1');

      expect(result.success).toBe(true);
      expect(mockNetworkClient.delete).toHaveBeenCalledWith(
        `${baseUrl}/entities/abc12345/api-keys/key-1`
      );
    });

    test('surfaces an API error', async () => {
      mockNetworkClient.delete.mockResolvedValueOnce(
        createErrorResponse('Insufficient permissions')
      );

      const result = await client.revokeApiKey('abc12345', 'key-1');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Insufficient permissions');
    });
  });
});
