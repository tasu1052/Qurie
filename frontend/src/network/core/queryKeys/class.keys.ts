export const classKeys = {
    all: ['classes'] as const,
    me: () => [...classKeys.all, 'me'] as const,
};
