export default function LivePreview({ apiUrl }) {
    return (
        <section className="bg-black p-8 rounded-lg border border-neutral-700 flex justify-center items-center min-h-[120px] mb-6">
            <img
                src={apiUrl}
                alt="LED Sign Preview"
                className="max-w-full h-auto"
                style={{ imageRendering: 'pixelated' }}
                onError={(e) => {
                    e.target.src = '';
                    e.target.alt = 'umm... something bad happened. wait 60 seconds, as Render needs to warm up, then try again. if it still doesn\'t work, check your input.';
                }}
            />
        </section>
    );
}