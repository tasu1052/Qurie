import { axiosInstance } from '../core/axiosInstance';

/** 반(클래스) 강의자료 메타데이터. 파일 본문은 다운로드 엔드포인트로만 받는다. */
export interface ClassMaterialResponse {
    id: number;
    classId: number;
    fileName: string;
    contentType: string;
    byteSize: number;
    uploadedBy: number;
    uploaderName: string;
    createdAt: string;
}

export const getClassMaterials = async (classId: number): Promise<ClassMaterialResponse[]> => {
    const { data } = await axiosInstance.get<ClassMaterialResponse[]>(
        `/classes/${classId}/materials`,
    );
    return data;
};

/** 자료 업로드 (강사 전용, 최대 30MB) */
export const uploadClassMaterial = async (
    classId: number,
    file: File,
): Promise<ClassMaterialResponse> => {
    const form = new FormData();
    form.append('file', file);
    const { data } = await axiosInstance.post<ClassMaterialResponse>(
        `/classes/${classId}/materials`,
        form,
        { headers: { 'Content-Type': 'multipart/form-data' } },
    );
    return data;
};

export const deleteClassMaterial = async (classId: number, materialId: number): Promise<void> => {
    await axiosInstance.delete(`/classes/${classId}/materials/${materialId}`);
};

/**
 * 자료를 받아 브라우저 다운로드로 저장한다.
 * 인증이 httpOnly 쿠키 + axios 인터셉터에 걸려 있어 <a href> 직링크 대신 blob 으로 받는다.
 */
export const downloadClassMaterial = async (
    classId: number,
    materialId: number,
    fileName: string,
): Promise<void> => {
    const { data } = await axiosInstance.get<Blob>(
        `/classes/${classId}/materials/${materialId}/download`,
        { responseType: 'blob' },
    );
    const url = URL.createObjectURL(data);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = fileName;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
};
