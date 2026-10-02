/**
 * @fileoverview Current Entity Context Hook
 * @description React context and hook for managing current entity selection
 *
 * This module provides a context-based system for managing the current entity
 * (workspace) selection. It automatically fetches entities when the user is
 * authenticated and selects the personal entity by default.
 *
 * @example
 * ```tsx
 * // In your app root
 * <CurrentEntityProvider client={entityClient} user={firebaseUser}>
 *   <App />
 * </CurrentEntityProvider>
 *
 * // In any component
 * function MyComponent() {
 *   const { currentEntity, entities, selectEntity, isLoading } = useCurrentEntity();
 *
 *   if (isLoading) return <Loading />;
 *
 *   return (
 *     <div>
 *       <h1>Current: {currentEntity?.displayName}</h1>
 *       <select onChange={e => selectEntity(e.target.value)}>
 *         {entities.map(e => (
 *           <option key={e.entitySlug} value={e.entitySlug}>
 *             {e.displayName}
 *           </option>
 *         ))}
 *       </select>
 *     </div>
 *   );
 * }
 * ```
 */

import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import { EntityType, type EntityWithRole } from '@sudobility/types';
import { EntityClient } from '../network/EntityClient';
import { useQueryClient } from '@tanstack/react-query';
import { EntityUserProvider } from './entityUser';
import { entityKeys, useEntities } from './useEntities';
import { invitationKeys } from './useInvitations';

/**
 * Minimal user interface for authentication.
 * Compatible with Firebase User object.
 */
export interface AuthUser {
  /** User's unique identifier (e.g., Firebase UID) */
  uid: string;
  /** User's email address */
  email?: string | null;
}

/**
 * Context value for current entity.
 */
export interface CurrentEntityContextValue {
  /** Currently selected entity (full object with role) */
  currentEntity: EntityWithRole | null;
  /** Current entity's slug for URL routing */
  currentEntitySlug: string | null;
  /** Current entity's ID */
  currentEntityId: string | null;
  /** All user's entities */
  entities: EntityWithRole[];
  /** Whether entities are loading */
  isLoading: boolean;
  /** Whether the initial load has completed (even if there was an error) */
  isInitialized: boolean;
  /** Error if any */
  error: Error | null;
  /** Select a different entity by slug */
  selectEntity: (entitySlug: string) => void;
  /** Select a different entity by ID */
  selectEntityById: (entityId: string) => void;
  /** Refresh entities list */
  refresh: () => void;
  /** Clear the current entity (e.g., on logout) */
  clear: () => void;
}

const CurrentEntityContext = createContext<CurrentEntityContextValue | null>(
  null
);

/**
 * Storage key for persisting selected entity.
 */
const STORAGE_KEY = 'currentEntitySlug';

/**
 * Props for CurrentEntityProvider.
 */
export interface CurrentEntityProviderProps {
  /** Entity API client */
  client: EntityClient;
  /** Child components */
  children: ReactNode;
  /** Current authenticated user (null if not authenticated) */
  user: AuthUser | null;
  /** Optional default entity slug (overrides personal entity auto-selection) */
  defaultEntitySlug?: string;
  /** Optional callback when current entity changes */
  onEntityChange?: (entity: EntityWithRole | null) => void;
}

/**
 * The remembered selection is per user: one account's workspace slug restored
 * for another would at best be ignored and at worst name a workspace the next
 * person also belongs to, which is not a choice they made.
 *
 * Storage can be missing (React Native has a `window` but no `localStorage`)
 * or throw (a private window, blocked site data), and neither is a reason to
 * fail to render, so every access is guarded.
 */
function storageKey(uid: string): string {
  return `${STORAGE_KEY}:${uid}`;
}

function storage(): Storage | null {
  try {
    return typeof localStorage === 'undefined' ? null : localStorage;
  } catch {
    return null;
  }
}

function readStoredSlug(uid: string | null): string | null {
  if (!uid) return null;
  try {
    return storage()?.getItem(storageKey(uid)) ?? null;
  } catch {
    return null;
  }
}

function writeStoredSlug(uid: string | null, slug: string): void {
  if (!uid) return;
  try {
    storage()?.setItem(storageKey(uid), slug);
  } catch {
    // Remembering the choice is a convenience; losing it is not an error.
  }
}

function removeStoredSlug(uid: string | null): void {
  try {
    const store = storage();
    // The shared key is what versions before per-user storage wrote.
    store?.removeItem(STORAGE_KEY);
    if (uid) store?.removeItem(storageKey(uid));
  } catch {
    // As above.
  }
}

/**
 * Find the personal entity from a list of entities.
 */
function findPersonalEntity(
  entities: EntityWithRole[]
): EntityWithRole | undefined {
  return entities.find(e => e.entityType === EntityType.PERSONAL);
}

/**
 * Provider component for current entity context.
 *
 * Features:
 * - Auto-fetches entities when user is authenticated
 * - Auto-selects personal entity by default
 * - Persists last selected entity to localStorage
 * - Clears state on logout
 */
export function CurrentEntityProvider({
  client,
  children,
  user,
  defaultEntitySlug,
  onEntityChange,
}: CurrentEntityProviderProps) {
  const uid = user?.uid ?? null;
  const queryClient = useQueryClient();
  const [selectedSlug, setSelectedSlug] = useState<string | null>(
    () => readStoredSlug(uid) || defaultEntitySlug || null
  );

  const [isInitialized, setIsInitialized] = useState(false);
  const previousUserUid = useRef<string | null>(uid);

  // Only fetch entities when user is authenticated. Named explicitly: this
  // provider is above the `EntityUserProvider` it renders.
  const {
    data: entities = [],
    isLoading: isEntitiesLoading,
    error,
    refetch,
  } = useEntities(client, { enabled: !!user, userId: uid });

  // Track if we're authenticated
  const isAuthenticated = !!user;

  // Handle a change of person: sign-in, sign-out, or one account replacing
  // another in the same tab without a sign-out in between.
  useEffect(() => {
    const previousUid = previousUserUid.current;
    if (uid === previousUid) return;
    previousUserUid.current = uid;

    // Every key already starts with the user, so nothing of the previous
    // person's can be served to the next. Dropping it is memory, and not
    // leaving one account's data in a tab another is now using.
    if (previousUid) {
      queryClient.removeQueries({ queryKey: entityKeys.all(previousUid) });
      queryClient.removeQueries({ queryKey: invitationKeys.all(previousUid) });
    }
    if (!uid) removeStoredSlug(previousUid);

    setSelectedSlug(readStoredSlug(uid) || defaultEntitySlug || null);
    setIsInitialized(false);
  }, [uid, queryClient, defaultEntitySlug]);

  // Determine current entity based on selection priority:
  // 1. Selected slug (if still valid in entities list)
  // 2. Last used (from localStorage, if still valid)
  // 3. Personal entity
  // 4. First entity
  const currentEntity = (() => {
    if (!isAuthenticated || entities.length === 0) {
      return null;
    }

    // If we have a selected slug, try to find it
    if (selectedSlug) {
      const found = entities.find(e => e.entitySlug === selectedSlug);
      if (found) return found;
    }

    // Try to find personal entity
    const personal = findPersonalEntity(entities);
    if (personal) return personal;

    // Fallback to first entity
    return entities[0] || null;
  })();

  // Persist selection and mark as initialized
  useEffect(() => {
    if (!isAuthenticated) return;

    if (currentEntity) writeStoredSlug(uid, currentEntity.entitySlug);

    // Mark as initialized once we have entities (even if empty) and not loading
    if (!isEntitiesLoading && isAuthenticated) {
      setIsInitialized(true);
    }
  }, [currentEntity, isEntitiesLoading, isAuthenticated, uid]);

  // Auto-select personal entity when entities are first loaded
  useEffect(() => {
    if (!isAuthenticated || isEntitiesLoading || entities.length === 0) {
      return;
    }

    // If no entity is currently selected, select the personal entity
    if (!selectedSlug || !entities.find(e => e.entitySlug === selectedSlug)) {
      const personal = findPersonalEntity(entities);
      if (personal) {
        setSelectedSlug(personal.entitySlug);
      } else if (entities.length > 0) {
        setSelectedSlug(entities[0].entitySlug);
      }
    }
  }, [entities, isEntitiesLoading, selectedSlug, isAuthenticated]);

  // Notify when current entity changes
  useEffect(() => {
    onEntityChange?.(currentEntity);
  }, [currentEntity, onEntityChange]);

  const selectEntity = useCallback((entitySlug: string) => {
    setSelectedSlug(entitySlug);
  }, []);

  const selectEntityById = useCallback(
    (entityId: string) => {
      const entity = entities.find(e => e.id === entityId);
      if (entity) {
        setSelectedSlug(entity.entitySlug);
      }
    },
    [entities]
  );

  const refresh = useCallback(() => {
    refetch();
  }, [refetch]);

  const clear = useCallback(() => {
    setSelectedSlug(null);
    setIsInitialized(false);
    removeStoredSlug(uid);
  }, [uid]);

  // Compute loading state
  const isLoading = isAuthenticated && isEntitiesLoading;

  const value: CurrentEntityContextValue = {
    currentEntity,
    currentEntitySlug: currentEntity?.entitySlug ?? null,
    currentEntityId: currentEntity?.id ?? null,
    entities: isAuthenticated ? entities : [],
    isLoading,
    isInitialized,
    error: error as Error | null,
    selectEntity,
    selectEntityById,
    refresh,
    clear,
  };

  return (
    <EntityUserProvider userId={uid}>
      <CurrentEntityContext.Provider value={value}>
        {children}
      </CurrentEntityContext.Provider>
    </EntityUserProvider>
  );
}

/**
 * Hook to access current entity context.
 *
 * @throws Error if used outside of CurrentEntityProvider
 *
 * @example
 * ```tsx
 * function Dashboard() {
 *   const { currentEntity, isLoading, selectEntity } = useCurrentEntity();
 *
 *   if (isLoading) return <Spinner />;
 *   if (!currentEntity) return <div>Please select a workspace</div>;
 *
 *   return <h1>Welcome to {currentEntity.displayName}</h1>;
 * }
 * ```
 */
export function useCurrentEntity(): CurrentEntityContextValue {
  const context = useContext(CurrentEntityContext);
  if (!context) {
    throw new Error(
      'useCurrentEntity must be used within CurrentEntityProvider'
    );
  }
  return context;
}

/**
 * Hook to access current entity context with a fallback for optional usage.
 * Returns null if not within a provider, instead of throwing.
 *
 * @example
 * ```tsx
 * function OptionalEntityDisplay() {
 *   const entityContext = useCurrentEntityOptional();
 *
 *   if (!entityContext?.currentEntity) {
 *     return <div>No workspace selected</div>;
 *   }
 *
 *   return <div>{entityContext.currentEntity.displayName}</div>;
 * }
 * ```
 */
export function useCurrentEntityOptional(): CurrentEntityContextValue | null {
  return useContext(CurrentEntityContext);
}
