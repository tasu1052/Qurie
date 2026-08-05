import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '../core/queryKeys';
import {
    deleteClassMaterial,
    downloadClassMaterial,
    getClassMaterials,
    uploadClassMaterial,
} from './material-apis';

/** 반 강의자료 목록. classId 가 없으면(내 반 미확정) 조회하지 않는다. */
export const useGetClassMaterials = (classId: number | null) => {
    return useQuery({
        queryKey:
            classId != null ? queryKeys.materials.byClass(classId) : ['materials', 'class', 'idle'],
        queryFn: () => getClassMaterials(classId as number),
        enabled: classId != null,
    });
};

export const useUploadClassMaterial = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ classId, file }: { classId: number; file: File }) =>
            uploadClassMaterial(classId, file),
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: queryKeys.materials.byClass(data.classId) });
        },
    });
};

export const useDeleteClassMaterial = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ classId, materialId }: { classId: number; materialId: number }) =>
            deleteClassMaterial(classId, materialId),
        onSuccess: (_data, variables) => {
            queryClient.invalidateQueries({
                queryKey: queryKeys.materials.byClass(variables.classId),
            });
        },
    });
};

/** blob 다운로드는 저장까지가 한 동작이라 mutation 으로 감싼다 (진행 상태 표시용). */
export const useDownloadClassMaterial = () => {
    return useMutation({
        mutationFn: ({
            classId,
            materialId,
            fileName,
        }: {
            classId: number;
            materialId: number;
            fileName: string;
        }) => downloadClassMaterial(classId, materialId, fileName),
    });
};
