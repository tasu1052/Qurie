export type UserRole = 'MASTER' | 'MANAGER' | 'STUDENT';

export type AsyncJobStatus = 'PENDING' | 'GENERATING' | 'DONE' | 'FAILED';

export interface PageMeta {
    page: number;
    size: number;
    total: number;
}

export interface PageResponse<T> {
    data: T[];
    meta: PageMeta;
}

export interface AsyncJobResponse {
    id: number;
    status: AsyncJobStatus;
    errorMessage?: string;
}

export interface ApiErrorBody {
    code: string;
    message: string;
    requestId: string;
}

export interface ListParams {
    page?: number;
    size?: number;
    sort?: string;
    q?: string;
}