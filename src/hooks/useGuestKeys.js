import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNotification } from '@aviary-ui/ui';
import { fetchGuestKeys, createGuestKey, updateGuestKey, deleteGuestKey } from '@/api/guestKeys';

export const GUEST_KEYS_KEY = 'guest-keys';

export function useGuestKeys(appId) {
  const queryClient = useQueryClient();
  const { showNotification } = useNotification();

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: [GUEST_KEYS_KEY],
    queryFn: fetchGuestKeys,
    select: (res) => {
      const all = res.data ?? [];
      return appId != null ? all.filter((k) => k.app_id === appId) : all;
    },
  });

  const guestKeys = data ?? [];
  const invalidate = () => queryClient.invalidateQueries({ queryKey: [GUEST_KEYS_KEY] });

  const createMutation = useMutation({
    mutationFn: (payload) => createGuestKey(payload),
    onSuccess: () => {
      invalidate();
      showNotification('Guest key created!', 'success');
    },
    onError: (err) => showNotification(err.message, 'error'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }) => updateGuestKey(id, payload),
    onSuccess: () => {
      invalidate();
      showNotification('Guest key updated!', 'success');
    },
    onError: (err) => showNotification(err.message, 'error'),
  });

  const removeMutation = useMutation({
    mutationFn: (id) => deleteGuestKey(id),
    onSuccess: () => {
      invalidate();
      showNotification('Guest key deleted!', 'success');
    },
    onError: (err) => showNotification(err.message, 'error'),
  });

  return {
    guestKeys,
    isLoading,
    error: error?.message ?? null,
    refetch,
    create: (payload) => createMutation.mutateAsync(payload),
    update: (id, payload) => updateMutation.mutateAsync({ id, payload }),
    remove: (id) => removeMutation.mutateAsync(id),
  };
}
