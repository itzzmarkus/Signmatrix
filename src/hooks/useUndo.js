import { useEffect, useRef, useState, useCallback } from 'react';

export default function useUndo(currentState, restoreState) {
    const [pastCount, setPastCount] = useState(0);
    const [futureCount, setFutureCount] = useState(0);

    const past = useRef([]);
    const future = useRef([]);
    const isRestoring = useRef(false);
    const lastSavedState = useRef(currentState);

    useEffect(() => {
        if (isRestoring.current) {
            isRestoring.current = false;
            lastSavedState.current = currentState;
            return;
        }

        if (JSON.stringify(lastSavedState.current) !== JSON.stringify(currentState)) {
            past.current.push(lastSavedState.current);
            if (past.current.length > 50) past.current.shift();

            future.current = [];
            lastSavedState.current = currentState;

            setPastCount(past.current.length);
            setFutureCount(future.current.length);
        }
    }, [currentState]);

    const undo = useCallback(() => {
        if (past.current.length === 0) return;

        const previousState = past.current.pop();
        future.current.push(lastSavedState.current);

        isRestoring.current = true;
        lastSavedState.current = previousState;

        setPastCount(past.current.length);
        setFutureCount(future.current.length);

        restoreState(previousState);
    }, [restoreState]);

    const redo = useCallback(() => {
        if (future.current.length === 0) return;

        const nextState = future.current.pop();
        past.current.push(lastSavedState.current);

        isRestoring.current = true;
        lastSavedState.current = nextState;

        setPastCount(past.current.length);
        setFutureCount(future.current.length);

        restoreState(nextState);
    }, [restoreState]);

    useEffect(() => {
        const handleKeyDown = (e) => {
            if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
                e.preventDefault();
                if (e.shiftKey) {
                    redo();
                } else {
                    undo();
                }
            } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') {
                e.preventDefault();
                redo();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [undo, redo]);

    return { undo, redo, canUndo: pastCount > 0, canRedo: futureCount > 0 };
}