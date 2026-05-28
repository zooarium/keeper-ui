// ─────────────────────────────────────────────────────────────────────────────
// useThing — SCAFFOLD TEMPLATE. Copy → rename → adapt. Do not import directly.
//
// Steps:
//   1. Copy this file to src/hooks/useFoo.js
//   2. Replace every "Thing" / "thing" / "things" with your resource name
//   3. Point API imports to src/api/foo.js
//   4. Add mock handlers to src/mocks/handlers.js
//   5. Delete this comment block
// ─────────────────────────────────────────────────────────────────────────────

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNotification } from '@aviary-ui/ui';
import { fetchThings, createThing, updateThing, deleteThing } from '@/api/thing';

// Export so other hooks can invalidate: queryClient.invalidateQueries({ queryKey: [THING_KEY] })
export const THING_KEY = 'things';

// filters: any URL query params as object.
// Different filter combos = separate cache entries.
export function useThing(filters = {}) {
  const queryClient = useQueryClient();
  const { showNotification } = useNotification();

  // ── READ ──────────────────────────────────────────────────────────────────
  const { data, isLoading, error } = useQuery({
    queryKey: [THING_KEY, filters],
    queryFn: () => fetchThings(filters),
    select: (res) => res.data?.things ?? [],
  });

  const things = data ?? [];

  const invalidate = () => queryClient.invalidateQueries({ queryKey: [THING_KEY] });

  // ── CREATE ────────────────────────────────────────────────────────────────
  const createMutation = useMutation({
    mutationFn: (payload) => createThing(payload),
    onSuccess: () => {
      invalidate();
      showNotification('Created successfully!', 'success');
    },
    onError: (err) => showNotification(err.message, 'error'),
  });

  // ── UPDATE ────────────────────────────────────────────────────────────────
  const updateMutation = useMutation({
    mutationFn: ({ id, payload }) => updateThing(id, payload),
    onSuccess: () => {
      invalidate();
      showNotification('Updated successfully!', 'success');
    },
    onError: (err) => showNotification(err.message, 'error'),
  });

  // ── DELETE ────────────────────────────────────────────────────────────────
  const removeMutation = useMutation({
    mutationFn: (id) => deleteThing(id),
    onSuccess: () => {
      invalidate();
      showNotification('Deleted successfully!', 'success');
    },
    onError: (err) => showNotification(err.message, 'error'),
  });

  return {
    things,
    isLoading,
    error: error?.message ?? null,
    create: (payload) => createMutation.mutateAsync(payload),
    update: (id, payload) => updateMutation.mutateAsync({ id, payload }),
    remove: (id) => removeMutation.mutateAsync(id),
  };
}
