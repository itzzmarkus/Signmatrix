import { useState, useEffect, useRef } from 'react';

export default function useDebounce(value, delay) {
    const [debouncedValue, setDebouncedValue] = useState(value);
    const serialized = typeof value === 'object' && value !== null ? JSON.stringify(value) : value;
    const lastSerialized = useRef(serialized);

    useEffect(() => {
        const handler = setTimeout(() => {
            if (serialized !== lastSerialized.current) {
                lastSerialized.current = serialized;
                setDebouncedValue(value);
            }
        }, delay);
        return () => clearTimeout(handler);
    }, [serialized, value, delay]);

    return debouncedValue;
}