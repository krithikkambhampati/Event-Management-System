export const verifyCaptcha = async (captchaToken) => {
    if (!captchaToken) {
        return { success: false, message: "CAPTCHA verification required" };
    }

    const secretKey = process.env.RECAPTCHA_SECRET_KEY;
    if (!secretKey) {
        console.warn("[reCAPTCHA] RECAPTCHA_SECRET_KEY not set — skipping verification");
        return { success: true };
    }

    const threshold = parseFloat(process.env.RECAPTCHA_SCORE_THRESHOLD ?? "0.5");

    try {
        const response = await fetch(
            `https://www.google.com/recaptcha/api/siteverify?secret=${secretKey}&response=${captchaToken}`,
            { method: "POST" }
        );

        const data = await response.json();

        console.log(`[reCAPTCHA] success=${data.success} | score=${data.score ?? "N/A"} | action=${data.action ?? "N/A"} | threshold=${threshold} | errors=${JSON.stringify(data["error-codes"] ?? [])}`);

        if (!data.success) {
            return { success: false, message: "CAPTCHA verification failed. Please try again." };
        }

        if (data.score !== undefined && data.score < threshold) {
            return { success: false, message: `Bot-like behaviour detected (score: ${data.score.toFixed(2)}). Please try again.` };
        }

        return { success: true, score: data.score };
    } catch (error) {
        console.warn("[reCAPTCHA] Service unreachable — skipping:", error.message);
        return { success: true };
    }
};
