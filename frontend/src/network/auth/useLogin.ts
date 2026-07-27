import { useMutation } from '@tanstack/react-query';
import { login } from './auth';

export const useLogin = () => {
    return useMutation({ mutationFn: login });
};