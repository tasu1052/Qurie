export type StudentCommentListParams = {
    classId?: number;
};

export const commentKeys = {
    all: ['comments'] as const,
    byUser: (userId: number, classIdOrParams?: number | null | StudentCommentListParams) => {
        const params: StudentCommentListParams =
            classIdOrParams == null || typeof classIdOrParams === 'object'
                ? (classIdOrParams ?? {})
                : { classId: classIdOrParams };
        return [...commentKeys.all, 'user', userId, params] as const;
    },
};
