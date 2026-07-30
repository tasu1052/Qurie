import { useMutation } from '@tanstack/react-query';
import { generateQuiz, type QuizGenerateRequest } from './quiz-apis';

export const useGenerateQuiz = () => {
    return useMutation({
        mutationFn: ({
            projectId,
            ...body
        }: QuizGenerateRequest & { projectId: number }) => generateQuiz(projectId, body),
    });
};
