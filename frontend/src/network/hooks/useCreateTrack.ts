import { useMutation } from '@tanstack/react-query';
import { createTrack } from '../api/track';

export const useCreateTrack = () => {
    return useMutation({ mutationFn: createTrack });
};