import nodemailer from "nodemailer";
import QRCode from "qrcode";

export const sendTicketEmail = async ({ to, participantName, eventName, ticketId, eventDate, eventType, selectedVariant }) => {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.warn("Email credentials not configured — skipping email send. Update EMAIL_USER and EMAIL_PASS in .env");
    return;
  }

  let qrDataUrl = "";
  try {
    qrDataUrl = await QRCode.toDataURL(ticketId, {
      width: 200,
      margin: 2,
      color: { dark: "#3A2F27", light: "#FFFFFF" }
    });
  } catch (err) {
    console.error("Failed to generate QR code:", err.message);
  }

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });

  const isMerch = eventType === "MERCH";
  const emailSubject = isMerch
    ? `Order Approved - ${eventName} | Ticket: ${ticketId}`
    : `Registration Confirmed - ${eventName} | Ticket: ${ticketId}`;
  const headerSubtitle = isMerch ? "Order Confirmation" : "Registration Confirmation";
  const greetingText = isMerch
    ? `Your payment has been approved and your order for <strong>${eventName}</strong> is confirmed!`
    : `You have been successfully registered for <strong>${eventName}</strong>!`;

  const qrSection = qrDataUrl ? `
    <div style="text-align: center; margin: 20px 0;">
      <p style="font-size: 12px; color: #8B7968; text-transform: uppercase; letter-spacing: 2px; margin: 0 0 12px;">Scan QR for Verification</p>
      <img src="${qrDataUrl}" alt="Ticket QR Code" style="width: 180px; height: 180px; border: 2px dashed #D9C9B8; border-radius: 8px; padding: 8px;" />
    </div>
  ` : "";

  const variantRow = isMerch && selectedVariant ? `
    <tr>
      <td style="padding: 6px 0; color: #8B7968; font-size: 13px;">Variant</td>
      <td style="padding: 6px 0; color: #3A2F27; font-weight: 600; text-align: right;">${selectedVariant}</td>
    </tr>
  ` : "";

  const mailOptions = {
    from: `"Event Manager" <${process.env.EMAIL_USER}>`,
    to,
    subject: emailSubject,
    html: `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; background-color: #FAF8F4; border: 1px solid #D9C9B8; border-radius: 12px; overflow: hidden;">
        
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #3A2F27 0%, #5C4D42 100%); padding: 24px 32px; text-align: center;">
          <h1 style="color: #FEFEFE; margin: 0; font-size: 22px; font-weight: 700;">Event Manager</h1>
          <p style="color: #E8D5C0; margin: 8px 0 0; font-size: 14px;">${headerSubtitle}</p>
        </div>

        <!-- Body -->
        <div style="padding: 32px;">
          <p style="font-size: 16px; color: #3A2F27; margin: 0 0 16px;">
            Hi <strong>${participantName}</strong>,
          </p>
          <p style="font-size: 16px; color: #5C4D42; margin: 0 0 24px;">
            ${greetingText}
          </p>

          <!-- Ticket Card -->
          <div style="background: #FFFFFF; border: 2px dashed #8B7968; border-radius: 8px; padding: 24px; text-align: center; margin-bottom: 24px;">
            <p style="font-size: 12px; color: #8B7968; text-transform: uppercase; letter-spacing: 2px; margin: 0 0 8px;">Your Ticket ID</p>
            <p style="font-size: 28px; font-weight: 700; color: #3A2F27; font-family: 'Courier New', monospace; letter-spacing: 3px; margin: 0;">
              ${ticketId}
            </p>
          </div>

          <!-- QR Code -->
          ${qrSection}

          <!-- Event Details -->
          <div style="background: #F5F0E8; border-radius: 8px; padding: 16px; margin-bottom: 24px;">
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 6px 0; color: #8B7968; font-size: 13px;">Event</td>
                <td style="padding: 6px 0; color: #3A2F27; font-weight: 600; text-align: right;">${eventName}</td>
              </tr>
              <tr>
                <td style="padding: 6px 0; color: #8B7968; font-size: 13px;">Type</td>
                <td style="padding: 6px 0; color: #3A2F27; font-weight: 500; text-align: right;">${isMerch ? "Merchandise Order" : "Normal Event"}</td>
              </tr>
              ${variantRow}
              <tr>
                <td style="padding: 6px 0; color: #8B7968; font-size: 13px;">Date</td>
                <td style="padding: 6px 0; color: #3A2F27; font-weight: 500; text-align: right;">${new Date(eventDate).toLocaleDateString("en-IN", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</td>
              </tr>
            </table>
          </div>

          <p style="font-size: 13px; color: #8B7968; margin: 0;">
            ${isMerch ? "Your order has been approved. Please keep your Ticket ID and QR code safe for collecting your merchandise." : "Please keep your Ticket ID and QR code safe — you will need them for check-in at the event."}
          </p>
        </div>

        <!-- Footer -->
        <div style="background: #F5F0E8; padding: 16px 32px; text-align: center; border-top: 1px solid #D9C9B8;">
          <p style="font-size: 12px; color: #8B7968; margin: 0;">
            This is an automated email from Event Manager. Do not reply to this email.
          </p>
        </div>
      </div>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
  } catch (error) {
    console.error("Failed to send ticket email:", error.message);
  }
};
