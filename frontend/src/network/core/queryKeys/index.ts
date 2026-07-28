import { sessionKeys } from './session.keys';
import { authKeys } from './auth.keys';
import { userKeys } from './user.keys';

export const queryKeys = { 
    sessions: sessionKeys,
    auth: authKeys, 
    users: userKeys
} as const;

export { sessionKeys, authKeys, userKeys };