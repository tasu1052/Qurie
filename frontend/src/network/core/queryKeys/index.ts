import { analyticsKeys } from './analytics.keys';
import { authKeys } from './auth.keys';
import { classKeys } from './class.keys';
import { groupKeys } from './group.keys';
import { invitationKeys } from './invitation.keys';
import { noticeKeys } from './notice.keys';
import { projectKeys } from './project.keys';
import { quizKeys, quizSetKeys } from './quiz.keys';
import { reportKeys } from './report.keys';
import { sessionKeys } from './session.keys';
import { trackKeys } from './track.keys';
import { userKeys } from './user.keys';

export const queryKeys = {
    auth: authKeys,
    invitations: invitationKeys,
    tracks: trackKeys,
    classes: classKeys,
    users: userKeys,
    notices: noticeKeys,
    sessions: sessionKeys,
    projects: projectKeys,
    quizSets: quizSetKeys,
    quizzes: quizKeys,
    reports: reportKeys,
    groups: groupKeys,
    analytics: analyticsKeys,
} as const;

export {
    analyticsKeys,
    authKeys,
    classKeys,
    groupKeys,
    invitationKeys,
    noticeKeys,
    projectKeys,
    quizKeys,
    quizSetKeys,
    reportKeys,
    sessionKeys,
    trackKeys,
    userKeys,
};