'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';
import { GeneratedQuestion, FactoryBlueprint, ValidationResult } from '../types/factory';
import { JsonValidator } from '../lib/factory/json-validator';
import { toast } from 'sonner';

interface FactoryContextType {
    blueprint: FactoryBlueprint | null;
    stagedQuestions: GeneratedQuestion[];
    isIngesting: boolean;
    validationErrors: string[];
    lastHealingReport: any | null;

    setBlueprint: (blueprint: FactoryBlueprint) => void;
    ingestRawJson: (json: string) => boolean;
    updateQuestion: (index: number, updates: Partial<GeneratedQuestion>) => void;
    removeQuestion: (index: number) => void;
    clearStage: () => void;
}

const FactoryContext = createContext<FactoryContextType | undefined>(undefined);

export function FactoryProvider({ children }: { children: ReactNode }) {
    const [blueprint, setBlueprint] = useState<FactoryBlueprint | null>(null);
    const [stagedQuestions, setStagedQuestions] = useState<GeneratedQuestion[]>([]);
    const [isIngesting, setIsIngesting] = useState(false);
    const [validationErrors, setValidationErrors] = useState<string[]>([]);
    const [lastHealingReport, setLastHealingReport] = useState<any | null>(null);

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
    };

    return (
        <FactoryContext.Provider value={{
            blueprint,
            stagedQuestions,
            isIngesting,
            validationErrors,
            lastHealingReport,
            setBlueprint,
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
