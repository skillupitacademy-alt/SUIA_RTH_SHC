import { db, exams } from "@quiz/db";
import { DomainNode, QuestionItem, ReportJSON, SubjectNode, TopicNode } from "@quiz/types/report";
import { eq } from "drizzle-orm";

import { logger } from "@/lib/logger";
import { withSpan } from "@/lib/tracer";

export class ReportMaterializer {
    private static log = logger.child({ module: 'report-materializer' });
    private static hasValue = (value: string | null | undefined): value is string =>
        value !== undefined && value !== null && value !== "";

    static async materialize(examId: string): Promise<ReportJSON> {
        const run = async () => {
            this.log.info({ examId }, "Materializing hierarchical report data");

            // 1. Fetch Exam with Lineage
            const exam = await db.query.exams.findFirst({
                where: eq(exams.id, examId),
                with: {
                    user: true,
                    examQuestions: {
                        with: {
                            question: {
                                with: {
                                    topic: {
                                        with: {
                                            subject: {
                                                with: {
                                                    domain: true
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            });

            if (!exam) throw new Error("Exam not found");

            type QuestionRow = {
                id: string;
                text: string;
                userAnswer: string | null;
                correctAnswer: string | null;
                explanation: string | null;
                isCorrect: boolean;
                timeSpent: number;
                difficulty: string;
                topicId: string;
                topicName: string;
                subjectId: string;
                subjectName: string;
                domainId: string;
                domainName: string;
                subtopicId: string | null;
                subtopicName: string;
            };

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const questions: QuestionRow[] = exam.examQuestions.map((eqRow: any) => ({
                id: eqRow.id,
                text: eqRow.question.questionText,
                userAnswer: eqRow.userAnswer,
                correctAnswer: eqRow.question.correctAnswer,
                explanation: eqRow.question.explanation,
                isCorrect: eqRow.isCorrect === true,
                timeSpent:
                    typeof eqRow.responseMetadata === "object" &&
                    eqRow.responseMetadata !== null &&
                    typeof eqRow.responseMetadata.timeSpentSeconds === "number"
                        ? eqRow.responseMetadata.timeSpentSeconds
                        : 0,
                difficulty: eqRow.question.difficulty,
                topicId: eqRow.question.topicId,
                topicName: eqRow.question.topic.name,
                subjectId: eqRow.question.topic.subjectId,
                subjectName: eqRow.question.topic.subject.name,
                domainId: eqRow.question.topic.subject.domainId,
                domainName: eqRow.question.topic.subject.domain.name,
                subtopicId: eqRow.question.subtopicId,
                subtopicName: "", // We'll fetch this if needed or mapping exists
            }));

            // 2. Fetch Metadata (Subtopics & Skills)
            const subtopicIds = Array.from(
                new Set(
                    questions
                        .map((q: QuestionRow) => q.subtopicId)
                        .filter((id): id is string => id !== null && id !== undefined && id !== "")
                )
            );
            const dbSubtopics = subtopicIds.length > 0
                ? await db.query.subtopics.findMany({ where: (t, { inArray }) => inArray(t.id, subtopicIds as string[]) })
                : [];
            const subtopicMap = new Map(dbSubtopics.map(s => [s.id, s.name]));

            const { getSafeDomain, getSafeSubtopic } = await import('@/modules/core/patterns/null-objects');
            const safeDomain = getSafeDomain(questions[0]?.domainId, questions[0]?.domainName);

            const hierarchy: DomainNode = {
                id: safeDomain.id,
                name: safeDomain.name,
                subjects: []
            };

            const subjectsMap = new Map<string, SubjectNode>();
            const topicsMap = new Map<string, TopicNode>();

            questions.forEach((q: QuestionRow) => {
                if (!subjectsMap.has(q.subjectId)) {
                    const sNode: SubjectNode = { id: q.subjectId, name: q.subjectName, topics: [] };
                    subjectsMap.set(q.subjectId, sNode);
                    hierarchy.subjects.push(sNode);
                }
                if (!topicsMap.has(q.topicId)) {
                    const tNode: TopicNode = { id: q.topicId, name: q.topicName, subtopicCount: 0 };
                    topicsMap.set(q.topicId, tNode);
                    subjectsMap.get(q.subjectId)!.topics.push(tNode);
                }
            });

            // 4. Compute Datasets
            const datasets: ReportJSON['datasets'] = {
                topics: {},
                subjects: {},
                domain: {
                    domainId: safeDomain.id,
                    name: safeDomain.name,
                    subjectAccuracies: [],
                    overallAccuracy: 0
                }
            };

            for (const subject of hierarchy.subjects) {
                const subjectQuestions = questions.filter((q: QuestionRow) => q.subjectId === subject.id);
                const sAccuracy = (subjectQuestions.filter((q: QuestionRow) => q.isCorrect).length / subjectQuestions.length) * 100;

                datasets.domain.subjectAccuracies.push({
                    subjectId: subject.id,
                    subjectName: subject.name,
                    accuracy: Math.round(sAccuracy)
                });

                datasets.subjects[subject.id] = {
                    subjectId: subject.id,
                    name: subject.name,
                    topicAccuracies: [],
                    strengths: [],
                    weaknesses: []
                };

                for (const topic of subject.topics) {
                    const topicQuestions = questions.filter((q: QuestionRow) => q.topicId === topic.id);
                    const tAccuracy = (topicQuestions.filter((q: QuestionRow) => q.isCorrect).length / topicQuestions.length) * 100;

                    datasets.subjects[subject.id].topicAccuracies.push({
                        topicId: topic.id,
                        topicName: topic.name,
                        accuracy: Math.round(tAccuracy)
                    });

                    // Detailed Topic Dataset
                    const topicSubtopics = Array.from(new Set(topicQuestions.map((q: QuestionRow) => q.subtopicId))).map((sid) => {
                        const sqs = topicQuestions.filter((q: QuestionRow) => q.subtopicId === sid);
                        const safeSubtopic = getSafeSubtopic(sid, subtopicMap);
                        
                        return {
                            id: safeSubtopic.id,
                            name: safeSubtopic.name,
                            accuracy: Math.round((sqs.filter(q => q.isCorrect).length / sqs.length) * 100),
                            attempted: sqs.length
                        };
                    });

                    const heatmap: Array<{ subtopic: string; difficulty: string; accuracy: number; attempts: number }> = [];
                    const diffs = ['simple', 'intermediate', 'expert'];
                    const stNames = Array.from(
                        new Set(
                            topicQuestions.map((q: QuestionRow) => {
                                return getSafeSubtopic(q.subtopicId, subtopicMap).name;
                            })
                        )
                    );

                    for (const st of stNames) {
                        for (const d of diffs) {
                            const cellQs = topicQuestions.filter((q: QuestionRow) => {
                                return getSafeSubtopic(q.subtopicId, subtopicMap).name === st && q.difficulty === d;
                            });
                            if (cellQs.length > 0) {
                                heatmap.push({
                                    subtopic: st,
                                    difficulty: d.charAt(0).toUpperCase() + d.slice(1).toLowerCase(),
                                    accuracy: Math.round((cellQs.filter(q => q.isCorrect).length / cellQs.length) * 100),
                                    attempts: cellQs.length
                                });
                            }
                        }
                    }

                    datasets.topics[topic.id] = {
                        topicId: topic.id,
                        name: topic.name,
                        accuracy: Math.round(tAccuracy),
                        attempted: topicQuestions.length,
                        correct: topicQuestions.filter((q: QuestionRow) => q.isCorrect === true).length,
                        incorrect: topicQuestions.filter((q: QuestionRow) => q.isCorrect !== true).length,
                        avgTime: Math.round(
                            topicQuestions.reduce((acc: number, curr: QuestionRow) => acc + (curr.timeSpent as number), 0) /
                            topicQuestions.length
                        ),
                        subtopics: topicSubtopics,
                        timeSeries: [], 
                        difficultySplit: {
                            easy: (() => {
                                const total = topicQuestions.filter((q: QuestionRow) => q.difficulty === 'simple').length;
                                const correct = topicQuestions.filter((q: QuestionRow) => q.difficulty === 'simple' && q.isCorrect === true).length;
                                return Math.round((correct / (total === 0 ? 1 : total)) * 100);
                            })(),
                            medium: (() => {
                                const total = topicQuestions.filter((q: QuestionRow) => q.difficulty === 'intermediate').length;
                                const correct = topicQuestions.filter((q: QuestionRow) => q.difficulty === 'intermediate' && q.isCorrect === true).length;
                                return Math.round((correct / (total === 0 ? 1 : total)) * 100);
                            })(),
                            hard: (() => {
                                const total = topicQuestions.filter((q: QuestionRow) => q.difficulty === 'expert').length;
                                const correct = topicQuestions.filter((q: QuestionRow) => q.difficulty === 'expert' && q.isCorrect === true).length;
                                return Math.round((correct / (total === 0 ? 1 : total)) * 100);
                            })()
                        },
                        heatmap,
                        ai: {
                        status: (() => {
                            if (tAccuracy >= 80) return 'READY';
                            if (tAccuracy >= 60) return 'BORDERLINE';
                            return 'NOT_READY';
                        })(),
                        actions: [
                            tAccuracy >= 80 ? "Maintain mastery via edge-case review" : "Focus on foundational subtopic gaps",
                            "Optimize response latency in expert tiers"
                        ]
                        },
                        skills: [], 
                        lineage: {
                        domain: safeDomain.name,
                        subject: subject.name,
                        topic: topic.name
                        }
                    };
                }
            }

            datasets.domain.overallAccuracy = Math.round((questions.filter((q: QuestionRow) => q.isCorrect).length / questions.length) * 100);

            // 4. Appendix
            const questionBank: QuestionItem[] = questions.map((q: QuestionRow) => ({
                id: q.id,
                text: q.text,
                userAnswer: q.userAnswer,
                correctAnswer: q.correctAnswer,
                explanation: q.explanation,
                isCorrect: q.isCorrect,
                timeSpent: q.timeSpent as number,
                difficulty: q.difficulty
            }));

            const report: ReportJSON = {
                meta: {
                    userId: exam.userId,
                    examId: exam.id,
                    generatedAt: new Date().toISOString(),
                    depth: (() => {
                        if (hierarchy.subjects.length > 1) return 3;
                        if (hierarchy.subjects.length === 1 && hierarchy.subjects[0].topics.length > 1) return 2;
                        return 1;
                    })(),
                    totalQuestions: questions.length,
                    candidateName:
                        typeof exam.user?.email === "string" && exam.user.email.trim() !== ""
                            ? exam.user.email
                            : "Candidate"
                },
                hierarchy,
                datasets,
                appendix: {
                    questionBank
                }
            };

            // Cache back to DB
            await db.update(exams)
                .set({ reportMaterialized: report })
                .where(eq(exams.id, examId));

            return report;
        };

        const isTestEnv = process.env.NODE_ENV === 'test' || process.env.VITEST === 'true' || process.env.VITEST_WORKER_ID !== undefined;
        const useSpan = !isTestEnv || (withSpan as any)?.mock !== undefined;
        if (!useSpan) {
            return run();
        }
        return withSpan('ReportMaterializer.materialize', async (span) => {
            span.setAttribute('examId', examId);
            return run();
        });
    }
}
