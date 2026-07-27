import { useState } from 'react';

function SuggestionBox() {
    const [suggestion, setSuggestion] = useState('');
    const [status, setStatus] = useState('idle');

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!suggestion.trim()) return;

        setStatus('loading');

        try {
            const response = await fetch('/api/suggest', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ suggestion })
            });

            if (!response.ok) throw new Error('Failed to submit');

            setStatus('success');
            setSuggestion('');

            setTimeout(() => setStatus('idle'), 3000);
        } catch (error) {
            console.error(error);
            setStatus('error');
            setTimeout(() => setStatus('idle'), 3000);
        }
    };

    return (
        <div className="bg-zinc-900 p-5 rounded-lg border border-neutral-700 w-full mt-8">
            <h2 className="text-lg font-semibold text-white mb-4">Got a suggestion? Found a bug?</h2>

            <form onSubmit={handleSubmit} className="flex flex-col gap-3">
                <textarea
                    value={suggestion}
                    onChange={(e) => setSuggestion(e.target.value)}
                    placeholder="type your idea/bug here..."
                    disabled={status === 'loading' || status === 'success'}
                    className="w-full p-3 h-24 rounded bg-neutral-800 border border-neutral-600 text-white placeholder-neutral-500 focus:outline-none focus:border-orange-500 resize-none disabled:opacity-50"
                />

                <div className="flex justify-end items-center gap-4">
                    {status === 'success' && <span className="text-green-400 text-sm font-semibold">sent! thanks!</span>}
                    {status === 'error' && <span className="text-red-400 text-sm font-semibold">uh oh, something broke.</span>}

                    <button
                        type="submit"
                        disabled={status === 'loading' || status === 'success' || !suggestion.trim()}
                        className="bg-neutral-700 hover:bg-orange-600 text-white font-semibold py-2 px-6 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {status === 'loading' ? 'Sending...' : 'Send'}
                    </button>
                </div>
            </form>
        </div>
    );
}

export default SuggestionBox;