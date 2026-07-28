import { sessionKeys } from './session.keys';
import { authKeys } from './auth.keys';

export const queryKeys = { 
    sessions: sessionKeys,
    auth: authKeys, 
} as const;

export { sessionKeys, authKeys };