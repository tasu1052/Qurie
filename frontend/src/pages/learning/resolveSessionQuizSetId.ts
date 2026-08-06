import { getSessionProject } from '../../network/project/project-apis';
import { listQuizSetsByProject } from '../../network/quiz/quiz-apis';

/**
 * 세션 → 프로젝트 → 퀴즈셋 순으로 지난 퀴즈 id를 찾는다.
 * 리포트 API에 의존하지 않는다(강사는 userId 없이 리포트 조회 시 404가 난다).
 */
export async function resolveSessionQuizSetId(sessionId: number): Promise<number | null> {
  const project = await getSessionProject(sessionId);
  if (project == null) return null;

  const sets = await listQuizSetsByProject(project.id);
  if (sets.length === 0) return null;

  const completed = sets.find((s) => s.status === 'COMPLETED');
  return (completed ?? sets[0]).quizSetId;
}
