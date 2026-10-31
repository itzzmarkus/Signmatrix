import { useEffect } from 'react';
import { encodeSignToHash } from '../utils/urlCodec.js';

function useUrlSync(debouncedState, graphicsById = {}) {
    useEffect(() => {
        if (typeof window === 'undefined') return;

        const hash = encodeSignToHash(debouncedState, graphicsById);
        const newUrl = hash ? `${window.location.pathname}#${hash}` : window.location.pathname;

        window.history.replaceState({}, '', newUrl);
    }, [debouncedState, graphicsById]);
}

export default useUrlSync;