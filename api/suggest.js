async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { suggestion } = req.body;

    if (!suggestion || suggestion.trim() === '') {
        return res.status(400).json({ error: 'Suggestion cannot be empty' });
    }

    const webhookUrl = process.env.DISCORD_WEBHOOK_URL;

    if (!webhookUrl) {
        return res.status(500).json({ error: 'Discord webhook URL is not configured' });
    }

    try {
        const response = await fetch(webhookUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                content: `**new suggestion**\n> ${suggestion}`
            })
        });

        if (!response.ok) throw new Error('Discord rejected the payload');

        res.status(200).json({ success: true });
    } catch (error) {
        console.error("Webhook error:", error);
        res.status(500).json({ error: 'Failed to send to Discord' });
    }
}

export default handler;