/**
 * @fileoverview Entity API Client
 * @description HTTP client for entity/organization API endpoints
 */

import type {
  BaseResponse,
  CreateEntityRequest,
  Entity,
  EntityInvitation,
  EntityMember,
  EntityRole,
  EntityWithRole,
  InviteMemberRequest,
  NetworkClient,
  UpdateEntityRequest,
} from '@sudobility/types';
import type {
  CreateApiKeyRequest,
  CreatedEntityApiKey,
  EntityApiKey,
  UpdateApiKeyRequest,
} from '../types/api-keys';

/**
 * Configuration for the Entity client.
 */
export interface EntityClientConfig {
  /** Base URL for the API (e.g., 'https://api.example.com/api/v1') */
  baseUrl: string;
  /** Network client for making HTTP requests */
  networkClient: NetworkClient;
}

/**
 * HTTP client for entity management APIs.
 */
export class EntityClient {
  private readonly baseUrl: string;
  private readonly networkClient: NetworkClient;

  constructor(config: EntityClientConfig) {
    this.baseUrl = config.baseUrl;
    this.networkClient = config.networkClient;
  }

  /**
   * Build full URL from path.
   */
  private buildUrl(path: string): string {
    const cleanBase = this.baseUrl.replace(/\/$/, '');
    return `${cleanBase}${path}`;
  }

  /**
   * Make a GET request.
   */
  private async get<T>(path: string): Promise<BaseResponse<T>> {
    try {
      const response = await this.networkClient.get<BaseResponse<T>>(
        this.buildUrl(path)
      );
      if (!response.ok || !response.data) {
        return {
          success: false,
          error: response.data?.error || 'Request failed',
          timestamp: new Date().toISOString(),
        };
      }
      return response.data;
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
        timestamp: new Date().toISOString(),
      };
    }
  }

  /**
   * Make a POST request.
   */
  private async post<T>(
    path: string,
    body?: unknown
  ): Promise<BaseResponse<T>> {
    try {
      const response = await this.networkClient.post<BaseResponse<T>>(
        this.buildUrl(path),
        body
      );
      if (!response.ok || !response.data) {
        return {
          success: false,
          error: response.data?.error || 'Request failed',
          timestamp: new Date().toISOString(),
        };
      }
      return response.data;
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
        timestamp: new Date().toISOString(),
      };
    }
  }

  /**
   * Make a PUT request.
   */
  private async put<T>(path: string, body?: unknown): Promise<BaseResponse<T>> {
    try {
      const response = await this.networkClient.put<BaseResponse<T>>(
        this.buildUrl(path),
        body
      );
      if (!response.ok || !response.data) {
        return {
          success: false,
          error: response.data?.error || 'Request failed',
          timestamp: new Date().toISOString(),
        };
      }
      return response.data;
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
        timestamp: new Date().toISOString(),
      };
    }
  }

  /**
   * Make a DELETE request.
   */
  private async del<T>(path: string): Promise<BaseResponse<T>> {
    try {
      const response = await this.networkClient.delete<BaseResponse<T>>(
        this.buildUrl(path)
      );
      if (!response.ok || !response.data) {
        return {
          success: false,
          error: response.data?.error || 'Request failed',
          timestamp: new Date().toISOString(),
        };
      }
      return response.data;
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
        timestamp: new Date().toISOString(),
      };
    }
  }

  // =============================================================================
  // Entity CRUD
  // =============================================================================

  /**
   * List all entities for the current user.
   */
  async listEntities(): Promise<BaseResponse<EntityWithRole[]>> {
    return this.get<EntityWithRole[]>('/entities');
  }

  /**
   * Create a new organization entity.
   */
  async createEntity(
    request: CreateEntityRequest
  ): Promise<BaseResponse<Entity>> {
    return this.post<Entity>('/entities', request);
  }

  /**
   * Get entity by slug.
   */
  async getEntity(entitySlug: string): Promise<BaseResponse<EntityWithRole>> {
    return this.get<EntityWithRole>(`/entities/${entitySlug}`);
  }

  /**
   * Update entity.
   */
  async updateEntity(
    entitySlug: string,
    request: UpdateEntityRequest
  ): Promise<BaseResponse<Entity>> {
    return this.put<Entity>(`/entities/${entitySlug}`, request);
  }

  /**
   * Delete entity (organizations only).
   */
  async deleteEntity(entitySlug: string): Promise<BaseResponse<void>> {
    return this.del<void>(`/entities/${entitySlug}`);
  }

  // =============================================================================
  // Member Management
  // =============================================================================

  /**
   * List members of an entity.
   */
  async listMembers(entitySlug: string): Promise<BaseResponse<EntityMember[]>> {
    return this.get<EntityMember[]>(`/entities/${entitySlug}/members`);
  }

  /**
   * Update a member's role.
   */
  async updateMemberRole(
    entitySlug: string,
    memberId: string,
    role: EntityRole
  ): Promise<BaseResponse<EntityMember>> {
    return this.put<EntityMember>(
      `/entities/${entitySlug}/members/${memberId}`,
      { role }
    );
  }

  /**
   * Remove a member from the entity.
   */
  async removeMember(
    entitySlug: string,
    memberId: string
  ): Promise<BaseResponse<void>> {
    return this.del<void>(`/entities/${entitySlug}/members/${memberId}`);
  }

  // =============================================================================
  // Invitation Management
  // =============================================================================

  /**
   * List invitations for an entity.
   */
  async listEntityInvitations(
    entitySlug: string
  ): Promise<BaseResponse<EntityInvitation[]>> {
    return this.get<EntityInvitation[]>(`/entities/${entitySlug}/invitations`);
  }

  /**
   * Create an invitation.
   */
  async createInvitation(
    entitySlug: string,
    request: InviteMemberRequest
  ): Promise<BaseResponse<EntityInvitation>> {
    return this.post<EntityInvitation>(
      `/entities/${entitySlug}/invitations`,
      request
    );
  }

  /**
   * Cancel an invitation.
   */
  async cancelInvitation(
    entitySlug: string,
    invitationId: string
  ): Promise<BaseResponse<void>> {
    return this.del<void>(
      `/entities/${entitySlug}/invitations/${invitationId}`
    );
  }

  /**
   * Renew an invitation with a new expiration date.
   */
  async renewInvitation(
    entitySlug: string,
    invitationId: string
  ): Promise<BaseResponse<EntityInvitation>> {
    return this.put<EntityInvitation>(
      `/entities/${entitySlug}/invitations/${invitationId}`
    );
  }

  /**
   * List pending invitations for the current user.
   */
  async listMyInvitations(): Promise<BaseResponse<EntityInvitation[]>> {
    return this.get<EntityInvitation[]>('/invitations');
  }

  /**
   * Accept an invitation.
   */
  async acceptInvitation(token: string): Promise<BaseResponse<void>> {
    return this.post<void>(`/invitations/${token}/accept`);
  }

  /**
   * Decline an invitation.
   */
  async declineInvitation(token: string): Promise<BaseResponse<void>> {
    return this.post<void>(`/invitations/${token}/decline`);
  }

  // =============================================================================
  // API Keys
  // =============================================================================

  /**
   * List an entity's API keys. Secrets are never returned.
   */
  async listApiKeys(entitySlug: string): Promise<BaseResponse<EntityApiKey[]>> {
    return this.get<EntityApiKey[]>(`/entities/${entitySlug}/api-keys`);
  }

  /**
   * Create an API key.
   * The response carries the plaintext key -- it cannot be retrieved again.
   */
  async createApiKey(
    entitySlug: string,
    request: CreateApiKeyRequest
  ): Promise<BaseResponse<CreatedEntityApiKey>> {
    return this.post<CreatedEntityApiKey>(
      `/entities/${entitySlug}/api-keys`,
      request
    );
  }

  /**
   * Rename an API key or toggle whether it is active.
   */
  async updateApiKey(
    entitySlug: string,
    keyId: string,
    request: UpdateApiKeyRequest
  ): Promise<BaseResponse<EntityApiKey>> {
    return this.put<EntityApiKey>(
      `/entities/${entitySlug}/api-keys/${keyId}`,
      request
    );
  }

  /**
   * Permanently revoke an API key.
   */
  async revokeApiKey(
    entitySlug: string,
    keyId: string
  ): Promise<BaseResponse<void>> {
    return this.del<void>(`/entities/${entitySlug}/api-keys/${keyId}`);
  }
}
