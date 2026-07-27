import { useSuspenseQuery } from '@tanstack/react-query';
import { getMe } from './auth';
import { queryKeys } from '../core/queryKeys';

export const useMe = () => {
    return useSuspenseQuery({
        queryKey: queryKeys.auth.me(),
        queryFn: getMe,
    });
};