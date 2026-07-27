import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createGroup } from '../group/group';
import { queryKeys } from '../core/queryKeys';

export const useCreateGroup = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: createGroup,
        onSuccess: (_, { class: className }) => {
        queryClient.invalidateQueries({ queryKey: queryKeys.group.all });
        queryClient.invalidateQueries({ queryKey: queryKeys.group.byClass(className) });
        },
    });
};