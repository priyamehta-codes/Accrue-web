import { useState, useEffect } from 'react';

/**
 * A useState drop-in that persists value to localStorage.
 * @param {string} key - The localStorage key
 * @param {*} initialValue - Default value if nothing is cached
 */
export function useCachedState(key, initialValue) {
    const [state, setState] = useState(() => {
        try {
            const cached = localStorage.getItem(key);
            return cached !== null ? JSON.parse(cached) : initialValue;
        } catch {
            return initialValue;
        }
    });

    useEffect(() => {
        try {
            localStorage.setItem(key, JSON.stringify(state));
        } catch {
            // Silently fail if storage is unavailable
        }
    }, [key, state]);

    return [state, setState];
}
