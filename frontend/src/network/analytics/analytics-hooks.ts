import { useSuspenseQuery } from '@tanstack/react-query';
import { queryKeys } from '../core/queryKeys';
import { getAnalyticsOverview, getClassAnalytics } from './analytics-apis';

export const useGetAnalyticsOverview = () => {
    return useSuspenseQuery({
        queryKey: queryKeys.analytics.overview(),
        queryFn: getAnalyticsOverview,
    });
};

export const useGetClassAnalytics = (classId: number) => {
    return useSuspenseQuery({
        queryKey: queryKeys.analytics.classDetail(classId),
        queryFn: () => getClassAnalytics(classId),
    });
};
