import { useMutation, useQueryClient, useSuspenseQuery } from '@tanstack/react-query';
import { queryKeys } from '../core/queryKeys';
import { createClass, getMyClasses, type ClassCreateRequest } from './class-apis';

export const useGetMyClasses = () => {
    return useSuspenseQuery({
        queryKey: queryKeys.classes.me(),
        queryFn: getMyClasses,
    });
};

export const useCreateClass = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (body: ClassCreateRequest) => createClass(body),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.classes.all });
        },
    });
};
