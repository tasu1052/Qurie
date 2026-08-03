import { analyticsKeys } from './analytics.keys';
import { authKeys } from './auth.keys';
import { classKeys } from './class.keys';
import { commentKeys } from './comment.keys';
import { groupKeys } from './group.keys';
import { invitationKeys } from './invitation.keys';
import { noticeKeys } from './notice.keys';
import { projectKeys } from './project.keys';
import { quizKeys } from './quiz.keys';
import { sessionKeys } from './session.keys';
import { trackKeys } from './track.keys';
import { userKeys } from './user.keys';

export const queryKeys = {
    analytics: analyticsKeys,
    auth: authKeys,
    classes: classKeys,
    comments: commentKeys,
    groups: groupKeys,
    invitations: invitationKeys,
    notices: noticeKeys,
    projects: projectKeys,
    quiz: quizKeys,
    sessions: sessionKeys,
    tracks: trackKeys,
    users: userKeys,
} as const;

export {
    analyticsKeys,
    authKeys,
    classKeys,
    commentKeys,
    groupKeys,
    invitationKeys,
    noticeKeys,
    projectKeys,
    quizKeys,
    sessionKeys,
    trackKeys,
    userKeys,
};
