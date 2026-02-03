'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';
import { GeneratedQuestion, FactoryBlueprint, ValidationResult } from '../types/factory';
import { JsonValidator } from '../lib/factory/json-validator';
import { toast } from 'sonner';

interface FactoryContextType {
    blueprint: FactoryBlueprint;
    sourceCode: string;
    stagedQuestions: GeneratedQuestion[];
    isIngesting: boolean;
    validationErrors: string[];
    lastHealingReport: any | null;

    setBlueprint: (blueprint: Partial<FactoryBlueprint>) => void;
    setSourceCode: (code: string) => void;
    ingestRawJson: (json: string) => boolean;
    updateQuestion: (index: number, updates: Partial<GeneratedQuestion>) => void;
    removeQuestion: (index: number) => void;
    clearStage: () => void;
}

const FactoryContext = createContext<FactoryContextType | undefined>(undefined);

const STORAGE_KEY = 'quiz-factory-storage-v1';

const DEFAULT_BLUEPRINT: FactoryBlueprint = {
    domainId: '',
    subjectId: '',
    topicId: '',
    subtopicId: '',
    counts: { simple: 2, intermediate: 5, expert: 3 }
};

export function FactoryProvider({ children }: { children: ReactNode }) {
    const [blueprint, setBlueprintState] = useState<FactoryBlueprint>(DEFAULT_BLUEPRINT);
    const [sourceCode, setSourceCode] = useState('');
    const [stagedQuestions, setStagedQuestions] = useState<GeneratedQuestion[]>([]);
    const [isIngesting, setIsIngesting] = useState(false);
    const [validationErrors, setValidationErrors] = useState<string[]>([]);
    const [lastHealingReport, setLastHealingReport] = useState<any | null>(null);
    const [isInitialized, setIsInitialized] = useState(false);

    // Hydrate from storage on mount
    React.useEffect(() => {
        try {
            const saved = localStorage.getItem(STORAGE_KEY);
            if (saved) {
                const parsed = JSON.parse(saved);
                if (parsed.blueprint) {
                    setBlueprintState(parsed.blueprint);
                }
                if (parsed.stagedQuestions) {
                    setStagedQuestions(parsed.stagedQuestions);
                }
                if (parsed.sourceCode) {
                    setSourceCode(parsed.sourceCode);
                }
            }
        } catch (e) {
            console.error("[Persistence] ❌ HYDRATION FAILED", e);
        } finally {
            setIsInitialized(true);
        }
    }, []);

    // Persist state on changes
    React.useEffect(() => {
        if (!isInitialized) {
            return;
        }

        const timeout = setTimeout(() => {
            try {
                const state = { blueprint, stagedQuestions, sourceCode };
                localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
            } catch (e) {
                console.error("Failed to persist factory state", e);
            }
        }, 500); // Debounce to avoid thrashing storage
        return () => clearTimeout(timeout);
    }, [blueprint, stagedQuestions, sourceCode, isInitialized]);

    const setBlueprint = (updates: Partial<FactoryBlueprint>) => {
        setBlueprintState(prev => ({ ...prev, ...updates }));
    };

    const ingestRawJson = (json: string): boolean => {
        setIsIngesting(true);
        setValidationErrors([]);
        setLastHealingReport(null);

        try {
            const result: ValidationResult = JsonValidator.validateBatch(json);
            setLastHealingReport(result.healingReport || null);

            if (result.isValid) {
                setStagedQuestions(result.questions);
                toast.success(`Successfully ingested ${result.questions.length} questions!`);
                return true;
            } else {
                setValidationErrors(result.errors);
                toast.error("Validation failed. Please check errors.");
                return false;
            }
        } catch (e) {
            toast.error("Critical parsing error.");
            return false;
        } finally {
            setIsIngesting(false);
        }
    };

    const updateQuestion = (index: number, updates: Partial<GeneratedQuestion>) => {
        setStagedQuestions(prev => {
            const next = [...prev];
            next[index] = { ...next[index], ...updates };
            return next;
        });
    };

    const removeQuestion = (index: number) => {
        setStagedQuestions(prev => prev.filter((_, i) => i !== index));
    };

    const clearStage = () => {
        setStagedQuestions([]);
        setValidationErrors([]);
        setLastHealingReport(null);
        // We might want to keep the blueprint (context) active even if we clear questions?
        // User requested "Clear Batch", usually implies clearing questions.
        // If they want to switch topic, they usually go back to ingest.
        // Let's keep blueprint for now, as it's the "folder" we are working in.
    };

    return (
        <FactoryContext.Provider value={{
            blueprint,
            sourceCode,
            stagedQuestions,
            isIngesting,
            validationErrors,
            lastHealingReport,
            setBlueprint,
            setSourceCode,
            ingestRawJson,
            updateQuestion,
            removeQuestion,
            clearStage
        }}>
            {children}
        </FactoryContext.Provider>
    );
}

export function useFactory() {
    const context = useContext(FactoryContext);
    if (!context) throw new Error("useFactory must be used within FactoryProvider");
    return context;
}
