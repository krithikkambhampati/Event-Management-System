
export const sendDiscordWebhook = async (webhookUrl, event, organizerName) => {
    if (!webhookUrl || typeof webhookUrl !== "string") return;

    if (!webhookUrl.startsWith("https://discord.com/api/webhooks/") &&
        !webhookUrl.startsWith("https://discordapp.com/api/webhooks/")) {
        console.warn("sendDiscordWebhook: Invalid webhook URL, skipping.");
        return;
    }

    const formatDate = (dateStr) => {
        return new Date(dateStr).toLocaleString("en-IN", {
            day: "numeric",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit"
        });
    };

    const fields = [
        { name: "📅 Start Date", value: formatDate(event.startDate), inline: true },
        { name: "📅 End Date", value: formatDate(event.endDate), inline: true },
        { name: "⏰ Registration Deadline", value: formatDate(event.registrationDeadline), inline: false },
        { name: "🎫 Type", value: event.eventType === "NORMAL" ? "Normal Event" : "Merchandise", inline: true },
        { name: "💰 Fee", value: event.registrationFee > 0 ? `₹${event.registrationFee}` : "Free", inline: true },
        { name: "✅ Eligibility", value: event.eligibility === "IIIT" ? "IIIT Only" : event.eligibility === "NON_IIIT" ? "Non-IIIT Only" : "Open to All", inline: true }
    ];

    if (event.registrationLimit) {
        fields.push({ name: "🪑 Capacity", value: String(event.registrationLimit), inline: true });
    }

    if (event.tags && event.tags.length > 0) {
        fields.push({ name: "🏷️ Tags", value: event.tags.join(", "), inline: false });
    }

    const description = event.description
        ? event.description.slice(0, 300) + (event.description.length > 300 ? "..." : "")
        : "";

    const payload = {
        username: organizerName || "Felicity Events",
        embeds: [
            {
                title: `🎉 New Event Published: ${event.eventName}`,
                description,
                color: 0xD4B5D4, // Lavender / app accent colour
                fields,
                footer: {
                    text: `Organized by ${organizerName} • Felicity Event Management`
                },
                timestamp: new Date().toISOString()
            }
        ]
    };

    try {
        const res = await fetch(webhookUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });

        if (!res.ok) {
            console.warn(`sendDiscordWebhook: Discord returned ${res.status} ${res.statusText}`);
        }
    } catch (err) {
        console.error("sendDiscordWebhook error:", err.message);
    }
};
