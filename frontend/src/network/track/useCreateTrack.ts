import { useMutation } from '@tanstack/react-query';
import { createTrack } from '../track/track';

export const useCreateTrack = () => {
    return useMutation({ mutationFn: createTrack });
};