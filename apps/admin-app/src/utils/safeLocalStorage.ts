import { clientLogger } from './clientLogger';

type JsonValue = string | number | boolean | null | Record<string, unknown> | JsonValue[];

interface StoredPayload {
    value: JsonValue;
    expiresAt?: number;
}

export const hasStorage = (): boolean => typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';

export function safeGet<T extends JsonValue = JsonValue>(key: string): T | null {
    if (!hasStorage()) return null;
    try {
        const raw = window.localStorage.getItem(key);
        if (raw === null) return null;
        const parsed = JSON.parse(raw) as StoredPayload | JsonValue;
        if (parsed !== null && typeof parsed === 'object' && 'value' in (parsed as Record<string, unknown>)) {
            const { value, expiresAt } = parsed as StoredPayload;
            if (expiresAt != null && expiresAt < Date.now()) {
                window.localStorage.removeItem(key);
                return null;
            }
            return value as T;
        }
        return parsed as T;
    } catch (error) {
        clientLogger.warn(`[safeLocalStorage] read failed for key: ${key}`, { error: error instanceof Error ? error.message : 'unknown' });
        return null;
    }
}

export function safeSet(key: string, value: JsonValue, ttlMs?: number): void {
    if (!hasStorage()) return;
    try {
        const payload: StoredPayload = { value, expiresAt: ttlMs != null ? Date.now() + ttlMs : undefined };
        window.localStorage.setItem(key, JSON.stringify(payload));
    } catch (error) {
        clientLogger.warn(`[safeLocalStorage] write failed for key: ${key}`, { error: error instanceof Error ? error.message : 'unknown' });
    }
}

export function safeRemove(key: string): void {
    if (!hasStorage()) return;
    try {
        window.localStorage.removeItem(key);
    } catch (error) {
        clientLogger.warn(`[safeLocalStorage] remove failed for key: ${key}`, { error: error instanceof Error ? error.message : 'unknown' });
    }
}

export function storageAvailable(): boolean {
    if (!hasStorage()) return false;
    try {
        const testKey = '__storage_probe__';
        window.localStorage.setItem(testKey, 'ok');
        window.localStorage.removeItem(testKey);
        return true;
    } catch {
        return false;
    }
}
