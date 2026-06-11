import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNotification } from '@aviary-ui/ui';
import { fetchUsers, createUser, updateUser, deleteUser } from '@/api/users';

export const USERS_KEY = 'users';

export function useUsers(appId) {
  const queryClient = useQueryClient();
  const { showNotification } = useNotification();

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: [USERS_KEY],
    queryFn: fetchUsers,
    select: (res) => {
      const all = res.data ?? [];
      return appId != null ? all.filter((u) => u.app_id === appId) : all;
    },
  });

  const users = data ?? [];
  const invalidate = () => queryClient.invalidateQueries({ queryKey: [USERS_KEY] });

  const createMutation = useMutation({
    mutationFn: (payload) => createUser(payload),
    onSuccess: () => {
      invalidate();
      showNotification('User created!', 'success');
    },
    onError: (err) => showNotification(err.message, 'error'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }) => updateUser(id, payload),
    onSuccess: () => {
      invalidate();
      showNotification('User updated!', 'success');
    },
    onError: (err) => showNotification(err.message, 'error'),
  });

  const removeMutation = useMutation({
    mutationFn: (id) => deleteUser(id),
    onSuccess: () => {
      invalidate();
      showNotification('User deleted!', 'success');
    },
    onError: (err) => showNotification(err.message, 'error'),
  });

  return {
    users,
    isLoading,
    error: error?.message ?? null,
    refetch,
    create: (payload) => createMutation.mutateAsync(payload),
    update: (id, payload) => updateMutation.mutateAsync({ id, payload }),
    remove: (id) => removeMutation.mutateAsync(id),
  };
}
