import { useSuspenseQuery } from '@tanstack/react-query';
import { getClasses } from './class';
import { queryKeys } from '../core/queryKeys';
import type { ListParams } from '../core/types';

export const useGetClasses = (
  filters: ListParams & { trackId?: number; tech?: string; status?: string } = {},
) => {
    return useSuspenseQuery({
        queryKey: queryKeys.classes.list(filters),
        queryFn: () => getClasses(filters),
    });
};