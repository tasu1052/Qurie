import { authKeys } from './auth.keys';
import { classKeys } from './class.keys';
import { sessionKeys } from './session.keys';
import { userKeys } from './user.keys';

export const queryKeys = {
    auth: authKeys,
    classes: classKeys,
    sessions: sessionKeys,
    users: userKeys,
} as const;

export { authKeys, classKeys, sessionKeys, userKeys };
