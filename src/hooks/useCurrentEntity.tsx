/**
 * @fileoverview Current Entity Context Hook
 * @description React context and hook for managing current entity selection
 */

import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';
import type { EntityWithRole } from '@sudobility/types';
import { EntityClient } from '../network/EntityClient';
import { useEntities } from './useEntities';

/**
 * Context value for current entity.
 */
export interface CurrentEntityContextValue {
  /** Currently selected entity */
  currentEntity: EntityWithRole | null;
  /** All user's entities */
  entities: EntityWithRole[];
  /** Whether entities are loading */
  isLoading: boolean;
  /** Error if any */
  error: Error | null;
  /** Select a different entity */
  selectEntity: (entitySlug: string) => void;
  /** Refresh entities list */
  refresh: () => void;
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
  /** Optional default entity slug */
  defaultEntitySlug?: string;
}

/**
 * Provider component for current entity context.
 */
export function CurrentEntityProvider({
  client,
  children,
  defaultEntitySlug,
}: CurrentEntityProviderProps) {
  const [selectedSlug, setSelectedSlug] = useState<string | null>(() => {
    // Try to restore from storage
    if (typeof window !== 'undefined') {
      return localStorage.getItem(STORAGE_KEY) || defaultEntitySlug || null;
    }
    return defaultEntitySlug || null;
  });

  const {
    data: entities = [],
    isLoading,
    error,
    refetch,
  } = useEntities(client);

  // Determine current entity
  const currentEntity =
    entities.find(e => e.entitySlug === selectedSlug) || entities[0] || null;

  // Persist selection
  useEffect(() => {
    if (currentEntity && typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, currentEntity.entitySlug);
    }
  }, [currentEntity]);

  // Auto-select first entity if none selected
  useEffect(() => {
    if (!selectedSlug && entities.length > 0) {
      setSelectedSlug(entities[0].entitySlug);
    }
  }, [entities, selectedSlug]);

  const selectEntity = useCallback((entitySlug: string) => {
    setSelectedSlug(entitySlug);
  }, []);

  const refresh = useCallback(() => {
    refetch();
  }, [refetch]);

  const value: CurrentEntityContextValue = {
    currentEntity,
    entities,
    isLoading,
    error: error as Error | null,
    selectEntity,
    refresh,
  };

  return (
    <CurrentEntityContext.Provider value={value}>
      {children}
    </CurrentEntityContext.Provider>
  );
}

/**
 * Hook to access current entity context.
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
