// @vitest-environment jsdom
/**
 * @fileoverview One account's workspaces must never be served to another.
 *
 * A tab that signed out and registered a new account kept the old account's
 * cached workspace list, so the app sent the old workspace's id on every
 * request and the server refused all of them. Every query key now starts with
 * the user, which is what these tests hold.
 */
import { afterEach, describe, expect, test, vi } from 'vitest';
import { act, cleanup, render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { EntityType, type EntityWithRole } from '@sudobility/types';
import type { EntityClient } from '../network/EntityClient';
import {
  CurrentEntityProvider,
  useCurrentEntity,
  type AuthUser,
} from './useCurrentEntity';
import { entityKeys } from './useEntities';

// Node's own `localStorage` global shadows jsdom's and is unusable without a
// backing file, so the test brings an in-memory one.
const stored = new Map<string, string>();
vi.stubGlobal('localStorage', {
  getItem: (key: string) => stored.get(key) ?? null,
  setItem: (key: string, value: string) => void stored.set(key, value),
  removeItem: (key: string) => void stored.delete(key),
  clear: () => stored.clear(),
});

afterEach(() => {
  cleanup();
  stored.clear();
});

function personal(owner: string): EntityWithRole {
  return {
    id: `${owner}-entity`,
    entitySlug: `${owner}-slug`,
    entityType: EntityType.PERSONAL,
    displayName: owner,
  } as EntityWithRole;
}

/** A server that answers each user with their own workspace. */
function clientFor(signedIn: { uid: string | null }) {
  return {
    listEntities: vi.fn(async () => ({
      success: true,
      data: [personal(signedIn.uid ?? 'nobody')],
    })),
  } as unknown as EntityClient;
}

function Probe() {
  const { currentEntityId } = useCurrentEntity();
  return <p>current:{String(currentEntityId)}</p>;
}

function setup() {
  const signedIn: { uid: string | null } = { uid: 'alice' };
  const client = clientFor(signedIn);
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  const seen: (string | null)[] = [];
  const tree = (user: AuthUser | null) => (
    <QueryClientProvider client={queryClient}>
      <CurrentEntityProvider
        client={client}
        user={user}
        onEntityChange={entity => seen.push(entity?.id ?? null)}
      >
        <Probe />
      </CurrentEntityProvider>
    </QueryClientProvider>
  );
  return { signedIn, queryClient, seen, tree };
}

describe('CurrentEntityProvider across accounts', () => {
  test('never offers the previous account its workspace', async () => {
    const { signedIn, seen, tree } = setup();
    const view = render(tree({ uid: 'alice' }));
    await waitFor(() =>
      expect(screen.getByText('current:alice-entity')).toBeTruthy()
    );

    // Another account in the same tab, with no sign-out in between.
    signedIn.uid = 'bob';
    const before = seen.length;
    act(() => view.rerender(tree({ uid: 'bob' })));
    await waitFor(() =>
      expect(screen.getByText('current:bob-entity')).toBeTruthy()
    );

    expect(seen.slice(before)).not.toContain('alice-entity');
  });

  test('caches each account under its own key, and drops the last one', async () => {
    const { signedIn, queryClient, tree } = setup();
    const view = render(tree({ uid: 'alice' }));
    await waitFor(() =>
      expect(queryClient.getQueryData(entityKeys.list('alice'))).toEqual([
        personal('alice'),
      ])
    );

    signedIn.uid = 'bob';
    act(() => view.rerender(tree({ uid: 'bob' })));
    await waitFor(() =>
      expect(queryClient.getQueryData(entityKeys.list('bob'))).toEqual([
        personal('bob'),
      ])
    );
    expect(queryClient.getQueryData(entityKeys.list('alice'))).toBeUndefined();
  });

  test('remembers the chosen workspace per account', async () => {
    const { tree } = setup();
    render(tree({ uid: 'alice' }));
    await waitFor(() =>
      expect(localStorage.getItem('currentEntitySlug:alice')).toBe('alice-slug')
    );
    expect(localStorage.getItem('currentEntitySlug')).toBeNull();
  });
});
