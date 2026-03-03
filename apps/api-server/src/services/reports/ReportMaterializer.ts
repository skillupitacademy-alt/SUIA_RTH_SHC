import { db, exams } from "@quiz/db";
import { DomainNode, QuestionItem, ReportJSON, SubjectNode, TopicNode } from "@quiz/types/report";
import { eq } from "drizzle-orm";

import { logger } from "@/lib/logger";

export class ReportMaterializer {
    private static log = logger.child({ module: 'report-materializer' });
    private static hasValue = (value: string | null | undefined): value is string =>
        value !== undefined && value !== null && value !== "";

    static async materialize(examId: string): Promise<ReportJSON> {
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

        const questions = exam.examQuestions.map(eq => ({
            id: eq.id,
            text: eq.question.questionText,
            userAnswer: eq.userAnswer,
            correctAnswer: eq.question.correctAnswer,
            explanation: eq.question.explanation,
            isCorrect: eq.isCorrect === true,
            timeSpent:
                typeof eq.responseMetadata === "object" &&
                eq.responseMetadata !== null &&
                typeof (eq.responseMetadata as { timeSpentSeconds?: number }).timeSpentSeconds === "number"
                    ? (eq.responseMetadata as { timeSpentSeconds?: number }).timeSpentSeconds
                    : 0,
            difficulty: eq.question.difficulty,
            topicId: eq.question.topicId,
            topicName: eq.question.topic.name,
            subjectId: eq.question.topic.subjectId,
            subjectName: eq.question.topic.subject.name,
            domainId: eq.question.topic.subject.domainId,
            domainName: eq.question.topic.subject.domain.name,
            subtopicId: eq.question.subtopicId,
            subtopicName: "", // We'll fetch this if needed or mapping exists
        }));

        // 2. Fetch Metadata (Subtopics & Skills)
        const subtopicIds = Array.from(
            new Set(
                questions
                    .map(q => q.subtopicId)
                    .filter((id): id is string => id !== null && id !== undefined && id !== "")
            )
        );
        const dbSubtopics = subtopicIds.length > 0
            ? await db.query.subtopics.findMany({ where: (t, { inArray }) => inArray(t.id, subtopicIds as string[]) })
            : [];
        const subtopicMap = new Map(dbSubtopics.map(s => [s.id, s.name]));

        // 3. Build Hierarchy Tree
        const domainId = questions[0]?.domainId ?? "unknown-domain";
        const domainName = questions[0]?.domainName ?? "Unknown Domain";

        const hierarchy: DomainNode = {
            id: domainId,
            name: domainName,
            subjects: []
        };

        const subjectsMap = new Map<string, SubjectNode>();
        const topicsMap = new Map<string, TopicNode>();

        questions.forEach(q => {
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
                domainId,
                name: domainName,
                subjectAccuracies: [],
                overallAccuracy: 0
            }
        };

        for (const subject of hierarchy.subjects) {
            const subjectQuestions = questions.filter(q => q.subjectId === subject.id);
            const sAccuracy = (subjectQuestions.filter(q => q.isCorrect).length / subjectQuestions.length) * 100;

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
                const topicQuestions = questions.filter(q => q.topicId === topic.id);
                const tAccuracy = (topicQuestions.filter(q => q.isCorrect).length / topicQuestions.length) * 100;

                datasets.subjects[subject.id].topicAccuracies.push({
                    topicId: topic.id,
                    topicName: topic.name,
                    accuracy: Math.round(tAccuracy)
                });

                // Detailed Topic Dataset
                const topicSubtopics = Array.from(new Set(topicQuestions.map(q => q.subtopicId))).map(sid => {
                    const sqs = topicQuestions.filter(q => q.subtopicId === sid);
                    const safeId = this.hasValue(sid) ? sid : "unknown";
                    const safeName = this.hasValue(sid) ? (subtopicMap.get(sid) ?? "Core Focus") : "Core Focus";
                    return {
                        id: safeId,
                        name: safeName,
                        accuracy: Math.round((sqs.filter(q => q.isCorrect).length / sqs.length) * 100),
                        attempted: sqs.length
                    };
                });

                const heatmap = [];
                const diffs = ['simple', 'intermediate', 'expert'];
                const stNames = Array.from(
                    new Set(
                        topicQuestions.map(q => {
                            const sid = q.subtopicId;
                            if (this.hasValue(sid)) {
                                return subtopicMap.get(sid) ?? "Core Focus";
                            }
                            return "Core Focus";
                        })
                    )
                );

                for (const st of stNames) {
                    for (const d of diffs) {
                        const cellQs = topicQuestions.filter(q => {
                            const sid = q.subtopicId;
                            const label = this.hasValue(sid) ? (subtopicMap.get(sid) ?? "Core Focus") : "Core Focus";
                            return label === st && q.difficulty === d;
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
                    correct: topicQuestions.filter(q => q.isCorrect).length,
                    incorrect: topicQuestions.filter(q => !q.isCorrect).length,
                    avgTime: Math.round(
                        topicQuestions.reduce((acc, curr) => acc + (curr.timeSpent as number), 0) /
                        topicQuestions.length
                    ),
                    subtopics: topicSubtopics,
                    timeSeries: [], 
                    difficultySplit: {
                        easy: Math.round((topicQuestions.filter(q => q.difficulty === 'simple' && q.isCorrect).length / (topicQuestions.filter(q => q.difficulty === 'simple').length || 1)) * 100),
                        medium: Math.round((topicQuestions.filter(q => q.difficulty === 'intermediate' && q.isCorrect).length / (topicQuestions.filter(q => q.difficulty === 'intermediate').length || 1)) * 100),
                        hard: Math.round((topicQuestions.filter(q => q.difficulty === 'expert' && q.isCorrect).length / (topicQuestions.filter(q => q.difficulty === 'expert').length || 1)) * 100)
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
                      domain: domainName,
                      subject: subject.name,
                      topic: topic.name
                    }
                };
            }
        }

        datasets.domain.overallAccuracy = Math.round((questions.filter(q => q.isCorrect).length / questions.length) * 100);

        // 4. Appendix
        const questionBank: QuestionItem[] = questions.map(q => ({
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
    }
}
