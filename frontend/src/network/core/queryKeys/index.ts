import { authKeys } from './auth.keys';
import { classKeys } from './class.keys';
import { groupKeys } from './group.keys';
import { sessionKeys } from './session.keys';
import { trackKeys } from './track.keys';
import { userKeys } from './user.keys';

export const queryKeys = {
    auth: authKeys,
    classes: classKeys,
    groups: groupKeys,
    sessions: sessionKeys,
    tracks: trackKeys,
    users: userKeys,
} as const;

export { authKeys, classKeys, groupKeys, sessionKeys, trackKeys, userKeys };
