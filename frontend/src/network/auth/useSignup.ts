import { useMutation } from '@tanstack/react-query';
import { signup } from '../auth/auth';

export const useSignup = () => {
    return useMutation({ mutationFn: signup });
};