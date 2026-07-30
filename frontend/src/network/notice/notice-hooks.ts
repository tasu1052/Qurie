import { useSuspenseQuery } from '@tanstack/react-query';
import { queryKeys } from '../core/queryKeys';
import type { NoticeListFilters } from '../core/queryKeys/notice.keys';
import { getNotices } from './notice-apis';

export const useGetNotices = (filters: NoticeListFilters = {}) => {
    return useSuspenseQuery({
        queryKey: queryKeys.notices.list(filters),
        queryFn: () => getNotices(filters),
    });
};
