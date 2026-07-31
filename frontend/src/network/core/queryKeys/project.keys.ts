export const projectKeys = {
    all: ['projects'] as const,
    detail: (projectId: number) => [...projectKeys.all, 'detail', projectId] as const,
    files: (projectId: number) => [...projectKeys.detail(projectId), 'files'] as const,
    fileContent: (projectId: number, path: string) =>
        [...projectKeys.files(projectId), 'content', path] as const,
};
