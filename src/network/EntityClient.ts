/**
 * @fileoverview Entity API Client
 * @description HTTP client for entity/organization API endpoints
 */

import type {
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
 * Standard API response wrapper.
 */
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
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
  private async get<T>(path: string): Promise<ApiResponse<T>> {
    try {
      const response = await this.networkClient.get<ApiResponse<T>>(
        this.buildUrl(path)
      );
      if (!response.ok || !response.data) {
        return {
          success: false,
          error: response.data?.error || 'Request failed',
        };
      }
      return response.data;
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Make a POST request.
   */
  private async post<T>(path: string, body?: unknown): Promise<ApiResponse<T>> {
    try {
      const response = await this.networkClient.post<ApiResponse<T>>(
        this.buildUrl(path),
        body
      );
      if (!response.ok || !response.data) {
        return {
          success: false,
          error: response.data?.error || 'Request failed',
        };
      }
      return response.data;
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Make a PUT request.
   */
  private async put<T>(path: string, body?: unknown): Promise<ApiResponse<T>> {
    try {
      const response = await this.networkClient.put<ApiResponse<T>>(
        this.buildUrl(path),
        body
      );
      if (!response.ok || !response.data) {
        return {
          success: false,
          error: response.data?.error || 'Request failed',
        };
      }
      return response.data;
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Make a DELETE request.
   */
  private async del<T>(path: string): Promise<ApiResponse<T>> {
    try {
      const response = await this.networkClient.delete<ApiResponse<T>>(
        this.buildUrl(path)
      );
      if (!response.ok || !response.data) {
        return {
          success: false,
          error: response.data?.error || 'Request failed',
        };
      }
      return response.data;
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  // =============================================================================
  // Entity CRUD
  // =============================================================================

  /**
   * List all entities for the current user.
   */
  async listEntities(): Promise<ApiResponse<EntityWithRole[]>> {
    return this.get<EntityWithRole[]>('/entities');
  }

  /**
   * Create a new organization entity.
   */
  async createEntity(
    request: CreateEntityRequest
  ): Promise<ApiResponse<Entity>> {
    return this.post<Entity>('/entities', request);
  }

  /**
   * Get entity by slug.
   */
  async getEntity(entitySlug: string): Promise<ApiResponse<EntityWithRole>> {
    return this.get<EntityWithRole>(`/entities/${entitySlug}`);
  }

  /**
   * Update entity.
   */
  async updateEntity(
    entitySlug: string,
    request: UpdateEntityRequest
  ): Promise<ApiResponse<Entity>> {
    return this.put<Entity>(`/entities/${entitySlug}`, request);
  }

  /**
   * Delete entity (organizations only).
   */
  async deleteEntity(entitySlug: string): Promise<ApiResponse<void>> {
    return this.del<void>(`/entities/${entitySlug}`);
  }

  // =============================================================================
  // Member Management
  // =============================================================================

  /**
   * List members of an entity.
   */
  async listMembers(entitySlug: string): Promise<ApiResponse<EntityMember[]>> {
    return this.get<EntityMember[]>(`/entities/${entitySlug}/members`);
  }

  /**
   * Update a member's role.
   */
  async updateMemberRole(
    entitySlug: string,
    memberId: string,
    role: EntityRole
  ): Promise<ApiResponse<EntityMember>> {
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
  ): Promise<ApiResponse<void>> {
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
  ): Promise<ApiResponse<EntityInvitation[]>> {
    return this.get<EntityInvitation[]>(`/entities/${entitySlug}/invitations`);
  }

  /**
   * Create an invitation.
   */
  async createInvitation(
    entitySlug: string,
    request: InviteMemberRequest
  ): Promise<ApiResponse<EntityInvitation>> {
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
  ): Promise<ApiResponse<void>> {
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
  ): Promise<ApiResponse<EntityInvitation>> {
    return this.put<EntityInvitation>(
      `/entities/${entitySlug}/invitations/${invitationId}`
    );
  }

  /**
   * List pending invitations for the current user.
   */
  async listMyInvitations(): Promise<ApiResponse<EntityInvitation[]>> {
    return this.get<EntityInvitation[]>('/invitations');
  }

  /**
   * Accept an invitation.
   */
  async acceptInvitation(token: string): Promise<ApiResponse<void>> {
    return this.post<void>(`/invitations/${token}/accept`);
  }

  /**
   * Decline an invitation.
   */
  async declineInvitation(token: string): Promise<ApiResponse<void>> {
    return this.post<void>(`/invitations/${token}/decline`);
  }
}
