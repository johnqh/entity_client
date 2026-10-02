/**
 * @fileoverview The signed-in user every entity query is cached under
 * @description Every query key in this package starts with the user id, so one
 * account's workspaces, members, invitations or keys can never be served to
 * another from cache.
 *
 * The cache used to be keyed only by what was fetched. A tab that signed out
 * and registered a new account kept the old account's workspace list, sent the
 * old workspace's id on every request, and was refused on all of them — the
 * request that would have corrected it included. Clearing the cache when the
 * user changes is a race against the first render after the change; keying by
 * user makes the wrong answer unreachable instead.
 */
import { createContext, type ReactNode, useContext } from 'react';

const EntityUserContext = createContext<string | null>(null);

/**
 * Names the signed-in user for every entity hook below it.
 *
 * `CurrentEntityProvider` renders one, so an app that uses it needs nothing
 * else. An app that calls the hooks without that provider wraps them in this.
 */
export function EntityUserProvider({
  userId,
  children,
}: {
  userId: string | null;
  children: ReactNode;
}) {
  return (
    <EntityUserContext.Provider value={userId}>
      {children}
    </EntityUserContext.Provider>
  );
}

/**
 * The user to key entity queries by: an explicit one where the caller has it,
 * otherwise the nearest provider's. `null` outside any provider, which is a
 * cache entry of its own and never another user's.
 */
export function useEntityUserId(explicit?: string | null): string | null {
  const fromContext = useContext(EntityUserContext);
  return explicit !== undefined ? explicit : fromContext;
}
