import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createClass } from './class';
import { queryKeys } from '../core/queryKeys';

export const useCreateClass = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createClass,
    onSuccess: (_, { track }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.class.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.class.byTrack(track) });
    },
  });
};