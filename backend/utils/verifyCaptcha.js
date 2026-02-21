// Verify reCAPTCHA token with Google's API
export const verifyCaptcha = async (captchaToken) => {
    if (!captchaToken) {
        return { success: false, message: "CAPTCHA verification required" };
    }

    const secretKey = process.env.RECAPTCHA_SECRET_KEY;
    if (!secretKey) {
        // If no secret key configured, skip verification (dev mode)
        console.warn("RECAPTCHA_SECRET_KEY not set — skipping CAPTCHA verification");
        return { success: true };
    }

    try {
        const response = await fetch(
            `https://www.google.com/recaptcha/api/siteverify?secret=${secretKey}&response=${captchaToken}`,
            { method: "POST" }
        );

        const data = await response.json();

        if (data.success) {
            return { success: true };
        } else {
            return { success: false, message: "CAPTCHA verification failed. Please try again." };
        }
    } catch (error) {
        console.error("CAPTCHA verification error:", error.message);
        return { success: false, message: "CAPTCHA verification service unavailable" };
    }
};
