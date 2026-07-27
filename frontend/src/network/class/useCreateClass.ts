import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createClass } from './class';
import { queryKeys } from '../core/queryKeys';

export const useCreateClass = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createClass,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.classes.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.tracks.classes(data.trackId) });
    },
  });
};