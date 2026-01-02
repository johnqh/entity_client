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
  UpdateEntityRequest,
} from '@sudobility/types';

/**
 * Configuration for the Entity client.
 */
export interface EntityClientConfig {
  /** Base URL for the API (e.g., 'https://api.example.com/api/v1') */
  baseUrl: string;
  /** Function to get the current auth token */
  getAuthToken: () => Promise<string | null>;
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
  constructor(private readonly config: EntityClientConfig) {}

  /**
   * Make an authenticated API request.
   */
  private async request<T>(
    path: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const token = await this.config.getAuthToken();
    if (!token) {
      return { success: false, error: 'Not authenticated' };
    }

    const url = `${this.config.baseUrl}${path}`;
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...options.headers,
    };

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      const data = await response.json();
      return data as ApiResponse<T>;
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
    return this.request<EntityWithRole[]>('/entities');
  }

  /**
   * Create a new organization entity.
   */
  async createEntity(
    request: CreateEntityRequest
  ): Promise<ApiResponse<Entity>> {
    return this.request<Entity>('/entities', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  /**
   * Get entity by slug.
   */
  async getEntity(entitySlug: string): Promise<ApiResponse<EntityWithRole>> {
    return this.request<EntityWithRole>(`/entities/${entitySlug}`);
  }

  /**
   * Update entity.
   */
  async updateEntity(
    entitySlug: string,
    request: UpdateEntityRequest
  ): Promise<ApiResponse<Entity>> {
    return this.request<Entity>(`/entities/${entitySlug}`, {
      method: 'PUT',
      body: JSON.stringify(request),
    });
  }

  /**
   * Delete entity (organizations only).
   */
  async deleteEntity(entitySlug: string): Promise<ApiResponse<void>> {
    return this.request<void>(`/entities/${entitySlug}`, {
      method: 'DELETE',
    });
  }

  // =============================================================================
  // Member Management
  // =============================================================================

  /**
   * List members of an entity.
   */
  async listMembers(entitySlug: string): Promise<ApiResponse<EntityMember[]>> {
    return this.request<EntityMember[]>(`/entities/${entitySlug}/members`);
  }

  /**
   * Update a member's role.
   */
  async updateMemberRole(
    entitySlug: string,
    memberId: string,
    role: EntityRole
  ): Promise<ApiResponse<EntityMember>> {
    return this.request<EntityMember>(
      `/entities/${entitySlug}/members/${memberId}`,
      {
        method: 'PUT',
        body: JSON.stringify({ role }),
      }
    );
  }

  /**
   * Remove a member from the entity.
   */
  async removeMember(
    entitySlug: string,
    memberId: string
  ): Promise<ApiResponse<void>> {
    return this.request<void>(`/entities/${entitySlug}/members/${memberId}`, {
      method: 'DELETE',
    });
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
    return this.request<EntityInvitation[]>(
      `/entities/${entitySlug}/invitations`
    );
  }

  /**
   * Create an invitation.
   */
  async createInvitation(
    entitySlug: string,
    request: InviteMemberRequest
  ): Promise<ApiResponse<EntityInvitation>> {
    return this.request<EntityInvitation>(
      `/entities/${entitySlug}/invitations`,
      {
        method: 'POST',
        body: JSON.stringify(request),
      }
    );
  }

  /**
   * Cancel an invitation.
   */
  async cancelInvitation(
    entitySlug: string,
    invitationId: string
  ): Promise<ApiResponse<void>> {
    return this.request<void>(
      `/entities/${entitySlug}/invitations/${invitationId}`,
      {
        method: 'DELETE',
      }
    );
  }

  /**
   * List pending invitations for the current user.
   */
  async listMyInvitations(): Promise<ApiResponse<EntityInvitation[]>> {
    return this.request<EntityInvitation[]>('/invitations');
  }

  /**
   * Accept an invitation.
   */
  async acceptInvitation(token: string): Promise<ApiResponse<void>> {
    return this.request<void>(`/invitations/${token}/accept`, {
      method: 'POST',
    });
  }

  /**
   * Decline an invitation.
   */
  async declineInvitation(token: string): Promise<ApiResponse<void>> {
    return this.request<void>(`/invitations/${token}/decline`, {
      method: 'POST',
    });
  }
}
