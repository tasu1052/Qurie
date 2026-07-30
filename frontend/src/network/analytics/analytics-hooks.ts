import { useSuspenseQuery } from '@tanstack/react-query';
import { queryKeys } from '../core/queryKeys';
import { getAnalyticsOverview } from './analytics-apis';

export const useGetAnalyticsOverview = () => {
    return useSuspenseQuery({
        queryKey: queryKeys.analytics.overview(),
        queryFn: getAnalyticsOverview,
    });
};
