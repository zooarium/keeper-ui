import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNotification } from '@aviary-ui/ui';
import { fetchApps, fetchApp, createApp, updateApp, deleteApp } from '@/api/apps';

export const APPS_KEY = 'apps';

export function useApps() {
  const queryClient = useQueryClient();
  const { showNotification } = useNotification();

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: [APPS_KEY],
    queryFn: fetchApps,
    select: (res) => res.data ?? [],
  });

  const apps = data ?? [];
  const invalidate = () => queryClient.invalidateQueries({ queryKey: [APPS_KEY] });

  const createMutation = useMutation({
    mutationFn: (payload) => createApp(payload),
    onSuccess: () => { invalidate(); showNotification('App created!', 'success'); },
    onError: (err) => showNotification(err.message, 'error'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }) => updateApp(id, payload),
    onSuccess: () => { invalidate(); showNotification('App updated!', 'success'); },
    onError: (err) => showNotification(err.message, 'error'),
  });

  const removeMutation = useMutation({
    mutationFn: (id) => deleteApp(id),
    onSuccess: () => { invalidate(); showNotification('App deleted!', 'success'); },
    onError: (err) => showNotification(err.message, 'error'),
  });

  return {
    apps,
    isLoading,
    error: error?.message ?? null,
    refetch,
    create: (payload) => createMutation.mutateAsync(payload),
    update: (id, payload) => updateMutation.mutateAsync({ id, payload }),
    remove: (id) => removeMutation.mutateAsync(id),
  };
}

export function useApp(id) {
  const queryClient = useQueryClient();
  const { showNotification } = useNotification();

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: [APPS_KEY, id],
    queryFn: () => fetchApp(id),
    select: (res) => res.data ?? null,
    enabled: !!id,
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: [APPS_KEY] });
    queryClient.invalidateQueries({ queryKey: [APPS_KEY, id] });
  };

  const updateMutation = useMutation({
    mutationFn: (payload) => updateApp(id, payload),
    onSuccess: () => { invalidate(); showNotification('App updated!', 'success'); },
    onError: (err) => showNotification(err.message, 'error'),
  });

  const removeMutation = useMutation({
    mutationFn: () => deleteApp(id),
    onSuccess: () => showNotification('App deleted!', 'success'),
    onError: (err) => showNotification(err.message, 'error'),
  });

  return {
    app: data ?? null,
    isLoading,
    error: error?.message ?? null,
    refetch,
    update: (payload) => updateMutation.mutateAsync(payload),
    remove: () => removeMutation.mutateAsync(),
  };
}
