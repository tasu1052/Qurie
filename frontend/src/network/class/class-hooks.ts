import { useMutation, useQueryClient, useSuspenseQuery } from '@tanstack/react-query';
import { queryKeys } from '../core/queryKeys';
import type { ClassListFilters } from '../core/queryKeys/class.keys';
import {
    createClass,
    deleteClass,
    getClass,
    getClasses,
    getMyClasses,
    updateClass,
    type ClassCreateRequest,
    type ClassUpdateRequest,
} from './class-apis';

export const useGetMyClasses = () => {
    return useSuspenseQuery({
        queryKey: queryKeys.classes.me(),
        queryFn: getMyClasses,
    });
};

export const useGetClasses = (filters: ClassListFilters = {}) => {
    return useSuspenseQuery({
        queryKey: queryKeys.classes.list(filters),
        queryFn: () => getClasses(filters),
    });
};

export const useGetClass = (classId: number) => {
    return useSuspenseQuery({
        queryKey: queryKeys.classes.detail(classId),
        queryFn: () => getClass(classId),
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

export const useUpdateClass = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ classId, ...body }: ClassUpdateRequest & { classId: number }) =>
            updateClass(classId, body),
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: queryKeys.classes.detail(data.id) });
            queryClient.invalidateQueries({ queryKey: queryKeys.classes.all });
        },
    });
};

export const useDeleteClass = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ classId }: { classId: number }) => deleteClass(classId),
        onSuccess: (_, { classId }) => {
            queryClient.invalidateQueries({ queryKey: queryKeys.classes.detail(classId) });
            queryClient.invalidateQueries({ queryKey: queryKeys.classes.all });
        },
    });
};
