function LivePreview({ apiUrl }) {
    return (
        <section className="bg-black p-8 rounded-lg border border-neutral-700 flex justify-center items-center min-h-[120px] mb-6">
            <img
                src={apiUrl}
                alt="LED Sign Preview"
                className="max-w-full h-auto"
                style={{ imageRendering: 'pixelated' }}
                onError={(e) => {
                    e.target.src = '';
                    e.target.alt = 'umm... check your input. if it still doesn\'t work, feel free to spam ping @itzzmarkus on discord.';
                }}
            />
        </section>
    );
}

export default LivePreview;