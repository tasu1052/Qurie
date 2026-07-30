import { analyticsKeys } from './analytics.keys';
import { authKeys } from './auth.keys';
import { classKeys } from './class.keys';
import { groupKeys } from './group.keys';
import { invitationKeys } from './invitation.keys';
import { noticeKeys } from './notice.keys';
import { sessionKeys } from './session.keys';
import { trackKeys } from './track.keys';
import { userKeys } from './user.keys';

export const queryKeys = {
    analytics: analyticsKeys,
    auth: authKeys,
    classes: classKeys,
    groups: groupKeys,
    invitations: invitationKeys,
    notices: noticeKeys,
    sessions: sessionKeys,
    tracks: trackKeys,
    users: userKeys,
} as const;

export {
    analyticsKeys,
    authKeys,
    classKeys,
    groupKeys,
    invitationKeys,
    noticeKeys,
    sessionKeys,
    trackKeys,
    userKeys,
};
