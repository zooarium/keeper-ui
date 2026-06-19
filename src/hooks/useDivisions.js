import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNotification } from '@aviary-ui/ui';
import {
  fetchDivisions,
  createDivision,
  updateDivision,
  deleteDivision,
  moveDivision,
} from '@/api/divisions';

export const DIVISIONS_KEY = 'divisions';

export function useDivisions(appId) {
  const queryClient = useQueryClient();
  const { showNotification } = useNotification();

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: [DIVISIONS_KEY],
    queryFn: fetchDivisions,
    select: (res) => {
      const all = res.data ?? [];
      return appId != null ? all.filter((d) => d.app_id === appId) : all;
    },
  });

  const divisions = data ?? [];
  const invalidate = () => queryClient.invalidateQueries({ queryKey: [DIVISIONS_KEY] });

  const createMutation = useMutation({
    mutationFn: (payload) => createDivision(payload),
    onSuccess: () => {
      invalidate();
      showNotification('Division created!', 'success');
    },
    onError: (err) => showNotification(err.message, 'error'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }) => updateDivision(id, payload),
    onSuccess: () => {
      invalidate();
      showNotification('Division updated!', 'success');
    },
    onError: (err) => showNotification(err.message, 'error'),
  });

  const removeMutation = useMutation({
    mutationFn: (id) => deleteDivision(id),
    onSuccess: () => {
      invalidate();
      showNotification('Division deleted!', 'success');
    },
    onError: (err) => showNotification(err.message, 'error'),
  });

  const moveMutation = useMutation({
    mutationFn: ({ id, parentId }) => moveDivision(id, parentId),
    onSuccess: () => {
      invalidate();
      showNotification('Division moved!', 'success');
    },
    onError: (err) => showNotification(err.message, 'error'),
  });

  return {
    divisions,
    isLoading,
    error: error?.message ?? null,
    refetch,
    create: (payload) => createMutation.mutateAsync(payload),
    update: (id, payload) => updateMutation.mutateAsync({ id, payload }),
    remove: (id) => removeMutation.mutateAsync(id),
    move: (id, parentId) => moveMutation.mutateAsync({ id, parentId }),
  };
}
