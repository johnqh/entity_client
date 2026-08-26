/**
 * @fileoverview Entity API Key Types
 * @description Wire types for entity-scoped API keys.
 *
 * These mirror the shapes returned by `@sudobility/entity_service`'s
 * `ApiKeyHelper`. They live here rather than in `@sudobility/types` so the
 * client can ship without waiting on a types release; move them once a
 * version carrying `EntityApiKey` is published.
 */

/**
 * An entity API key as returned by the API.
 * Never carries the secret -- only the display prefix.
 */
export interface EntityApiKey {
  id: string;
  entityId: string;
  keyName: string;
  /** Leading characters of the key, e.g. "shyft_a1b2c3" */
  keyPrefix: string;
  createdByUserId: string;
  isActive: boolean;
  lastUsedAt: string | null;
  createdAt: string | null;
  updatedAt: string | null;
}

/**
 * A newly created key, including the plaintext secret.
 * The secret is returned exactly once and cannot be recovered afterwards.
 */
export interface CreatedEntityApiKey extends EntityApiKey {
  /** Plaintext key -- show once, never stored */
  key: string;
}

/** Request body for creating an API key */
export interface CreateApiKeyRequest {
  /** Human-readable label for the key */
  key_name: string;
}

/** Request body for updating an API key */
export interface UpdateApiKeyRequest {
  /** New label */
  key_name?: string;
  /** Whether the key may authenticate requests */
  is_active?: boolean;
}
