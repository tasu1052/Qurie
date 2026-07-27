import { useMutation } from '@tanstack/react-query';
import { signup } from '../api/auth';

export const useSignup = () => {
    return useMutation({ mutationFn: signup });
};