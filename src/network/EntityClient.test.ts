/**
 * @fileoverview Tests for EntityClient
 */

import { describe, test, expect, beforeEach, mock, spyOn } from 'bun:test';
import { EntityClient, type EntityClientConfig } from './EntityClient';

// Mock response factory
function createMockResponse<T>(data: T, success = true) {
  return {
    json: async () => ({ success, data, error: success ? undefined : 'Error' }),
    ok: success,
  };
}

function createErrorResponse(error: string) {
  return {
    json: async () => ({ success: false, error }),
    ok: false,
  };
}

describe('EntityClient', () => {
  let client: EntityClient;
  let mockFetch: ReturnType<typeof spyOn>;
  const baseUrl = 'https://api.example.com/api/v1';
  const mockToken = 'mock-auth-token';

  const config: EntityClientConfig = {
    baseUrl,
    getAuthToken: async () => mockToken,
  };

  beforeEach(() => {
    client = new EntityClient(config);
    mockFetch = spyOn(globalThis, 'fetch');
  });

  // =============================================================================
  // Authentication
  // =============================================================================

  describe('authentication', () => {
    test('returns error when not authenticated', async () => {
      const unauthClient = new EntityClient({
        baseUrl,
        getAuthToken: async () => null,
      });

      const result = await unauthClient.listEntities();

      expect(result.success).toBe(false);
      expect(result.error).toBe('Not authenticated');
    });

    test('includes auth token in requests', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse([]));

      await client.listEntities();

      expect(mockFetch).toHaveBeenCalledWith(
        `${baseUrl}/entities`,
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: `Bearer ${mockToken}`,
          }),
        })
      );
    });
  });

  // =============================================================================
  // Entity CRUD
  // =============================================================================

  describe('listEntities', () => {
    test('fetches entities list', async () => {
      const mockEntities = [
        { id: '1', entitySlug: 'abc12345', displayName: 'Test' },
      ];
      mockFetch.mockResolvedValueOnce(createMockResponse(mockEntities));

      const result = await client.listEntities();

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockEntities);
      expect(mockFetch).toHaveBeenCalledWith(
        `${baseUrl}/entities`,
        expect.any(Object)
      );
    });
  });

  describe('createEntity', () => {
    test('creates entity with request body', async () => {
      const newEntity = { id: '1', entitySlug: 'neworg12', displayName: 'New Org' };
      mockFetch.mockResolvedValueOnce(createMockResponse(newEntity));

      const result = await client.createEntity({
        displayName: 'New Org',
        entitySlug: 'neworg12',
      });

      expect(result.success).toBe(true);
      expect(result.data).toEqual(newEntity);
      expect(mockFetch).toHaveBeenCalledWith(
        `${baseUrl}/entities`,
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ displayName: 'New Org', entitySlug: 'neworg12' }),
        })
      );
    });
  });

  describe('getEntity', () => {
    test('fetches entity by slug', async () => {
      const mockEntity = { id: '1', entitySlug: 'abc12345', displayName: 'Test' };
      mockFetch.mockResolvedValueOnce(createMockResponse(mockEntity));

      const result = await client.getEntity('abc12345');

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockEntity);
      expect(mockFetch).toHaveBeenCalledWith(
        `${baseUrl}/entities/abc12345`,
        expect.any(Object)
      );
    });
  });

  describe('updateEntity', () => {
    test('updates entity with request body', async () => {
      const updatedEntity = { id: '1', entitySlug: 'abc12345', displayName: 'Updated' };
      mockFetch.mockResolvedValueOnce(createMockResponse(updatedEntity));

      const result = await client.updateEntity('abc12345', {
        displayName: 'Updated',
      });

      expect(result.success).toBe(true);
      expect(result.data).toEqual(updatedEntity);
      expect(mockFetch).toHaveBeenCalledWith(
        `${baseUrl}/entities/abc12345`,
        expect.objectContaining({
          method: 'PUT',
          body: JSON.stringify({ displayName: 'Updated' }),
        })
      );
    });
  });

  describe('deleteEntity', () => {
    test('deletes entity by slug', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse(undefined));

      const result = await client.deleteEntity('abc12345');

      expect(result.success).toBe(true);
      expect(mockFetch).toHaveBeenCalledWith(
        `${baseUrl}/entities/abc12345`,
        expect.objectContaining({ method: 'DELETE' })
      );
    });
  });

  // =============================================================================
  // Member Management
  // =============================================================================

  describe('listMembers', () => {
    test('fetches members list for entity', async () => {
      const mockMembers = [{ id: 'm1', userId: 'u1', role: 'admin' }];
      mockFetch.mockResolvedValueOnce(createMockResponse(mockMembers));

      const result = await client.listMembers('abc12345');

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockMembers);
      expect(mockFetch).toHaveBeenCalledWith(
        `${baseUrl}/entities/abc12345/members`,
        expect.any(Object)
      );
    });
  });

  describe('updateMemberRole', () => {
    test('updates member role', async () => {
      const updatedMember = { id: 'm1', userId: 'u1', role: 'manager' };
      mockFetch.mockResolvedValueOnce(createMockResponse(updatedMember));

      const result = await client.updateMemberRole('abc12345', 'm1', 'manager' as any);

      expect(result.success).toBe(true);
      expect(result.data).toEqual(updatedMember);
      expect(mockFetch).toHaveBeenCalledWith(
        `${baseUrl}/entities/abc12345/members/m1`,
        expect.objectContaining({
          method: 'PUT',
          body: JSON.stringify({ role: 'manager' }),
        })
      );
    });
  });

  describe('removeMember', () => {
    test('removes member from entity', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse(undefined));

      const result = await client.removeMember('abc12345', 'm1');

      expect(result.success).toBe(true);
      expect(mockFetch).toHaveBeenCalledWith(
        `${baseUrl}/entities/abc12345/members/m1`,
        expect.objectContaining({ method: 'DELETE' })
      );
    });
  });

  // =============================================================================
  // Invitation Management
  // =============================================================================

  describe('listEntityInvitations', () => {
    test('fetches invitations for entity', async () => {
      const mockInvitations = [{ id: 'i1', email: 'test@example.com' }];
      mockFetch.mockResolvedValueOnce(createMockResponse(mockInvitations));

      const result = await client.listEntityInvitations('abc12345');

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockInvitations);
      expect(mockFetch).toHaveBeenCalledWith(
        `${baseUrl}/entities/abc12345/invitations`,
        expect.any(Object)
      );
    });
  });

  describe('createInvitation', () => {
    test('creates invitation with request body', async () => {
      const newInvitation = { id: 'i1', email: 'new@example.com', role: 'viewer' };
      mockFetch.mockResolvedValueOnce(createMockResponse(newInvitation));

      const result = await client.createInvitation('abc12345', {
        email: 'new@example.com',
        role: 'viewer' as any,
      });

      expect(result.success).toBe(true);
      expect(result.data).toEqual(newInvitation);
      expect(mockFetch).toHaveBeenCalledWith(
        `${baseUrl}/entities/abc12345/invitations`,
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ email: 'new@example.com', role: 'viewer' }),
        })
      );
    });
  });

  describe('cancelInvitation', () => {
    test('cancels invitation', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse(undefined));

      const result = await client.cancelInvitation('abc12345', 'i1');

      expect(result.success).toBe(true);
      expect(mockFetch).toHaveBeenCalledWith(
        `${baseUrl}/entities/abc12345/invitations/i1`,
        expect.objectContaining({ method: 'DELETE' })
      );
    });
  });

  describe('listMyInvitations', () => {
    test('fetches pending invitations for current user', async () => {
      const mockInvitations = [{ id: 'i1', email: 'me@example.com' }];
      mockFetch.mockResolvedValueOnce(createMockResponse(mockInvitations));

      const result = await client.listMyInvitations();

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockInvitations);
      expect(mockFetch).toHaveBeenCalledWith(
        `${baseUrl}/invitations`,
        expect.any(Object)
      );
    });
  });

  describe('acceptInvitation', () => {
    test('accepts invitation by token', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse(undefined));

      const result = await client.acceptInvitation('token123');

      expect(result.success).toBe(true);
      expect(mockFetch).toHaveBeenCalledWith(
        `${baseUrl}/invitations/token123/accept`,
        expect.objectContaining({ method: 'POST' })
      );
    });
  });

  describe('declineInvitation', () => {
    test('declines invitation by token', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse(undefined));

      const result = await client.declineInvitation('token123');

      expect(result.success).toBe(true);
      expect(mockFetch).toHaveBeenCalledWith(
        `${baseUrl}/invitations/token123/decline`,
        expect.objectContaining({ method: 'POST' })
      );
    });
  });

  // =============================================================================
  // Error Handling
  // =============================================================================

  describe('error handling', () => {
    test('handles network errors', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const result = await client.listEntities();

      expect(result.success).toBe(false);
      expect(result.error).toBe('Network error');
    });

    test('handles API error responses', async () => {
      mockFetch.mockResolvedValueOnce(createErrorResponse('Not found'));

      const result = await client.getEntity('notfound');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Not found');
    });
  });
});
