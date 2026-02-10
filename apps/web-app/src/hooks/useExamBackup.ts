'use client';

import { useEffect, useCallback, useRef } from 'react';

const BACKUP_KEY_PREFIX = 'exam_backup_';

interface BackupData {
    examId: string;
    answers: Record<string, string>;
    lastUpdated: number;
}

export function useExamBackup(examId: string | undefined, answers: Record<string, string>) {
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);

    // 1. Persistence Logic (Debounced)
    const saveBackup = useCallback((id: string, currentAnswers: Record<string, string>) => {
        if (Object.keys(currentAnswers).length === 0) return;

        const data: BackupData = {
            examId: id,
            answers: currentAnswers,
            lastUpdated: Date.now()
        };

        localStorage.setItem(`${BACKUP_KEY_PREFIX}${id}`, JSON.stringify(data));
        // Keep track of the active examId for resume logic
        localStorage.setItem('active_exam_id', id);
    }, []);

    useEffect(() => {
        if (!examId || Object.keys(answers).length === 0) return;

        if (timeoutRef.current) clearTimeout(timeoutRef.current);

        timeoutRef.current = setTimeout(() => {
            saveBackup(examId, answers);
        }, 500); // 500ms debounce

        return () => {
            if (timeoutRef.current) clearTimeout(timeoutRef.current);
        };
    }, [examId, answers, saveBackup]);

    // 2. Clear Backup Helper
    const clearBackup = useCallback((id: string) => {
        localStorage.removeItem(`${BACKUP_KEY_PREFIX}${id}`);
        if (localStorage.getItem('active_exam_id') === id) {
            localStorage.removeItem('active_exam_id');
        }
    }, []);

    return { clearBackup };
}

/**
 * Static Helper to retrieve backup data without hook context
 */
export function getExamBackup(examId: string): BackupData | null {
    if (typeof window === 'undefined') return null;
    const raw = localStorage.getItem(`${BACKUP_KEY_PREFIX}${examId}`);
    if (!raw) return null;
    try {
        return JSON.parse(raw);
    } catch {
        return null;
    }
}

export function getActiveExamId(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('active_exam_id');
}

/**
 * Reconciles local backup with server-issued state.
 * Returns only answers for questionIds that actually belong to this exam on the server.
 */
export function getFilteredBackup(serverExamId: string, serverQuestionIds: string[]): Record<string, string> {
    const backup = getExamBackup(serverExamId);
    if (!backup) return {};

    const filtered: Record<string, string> = {};
    const validQuestionIds = new Set(serverQuestionIds);

    Object.entries(backup.answers).forEach(([qId, answer]) => {
        if (validQuestionIds.has(qId)) {
            filtered[qId] = answer;
        }
    });

    return filtered;
}
