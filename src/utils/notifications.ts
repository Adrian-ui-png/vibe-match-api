import nodemailer from 'nodemailer';

/**
 * Send match alert emails to both the creator and the crush when a match is verified
 */
export const sendMatchNotification = async (
  creatorName: string,
  creatorContact: string,
  crushName: string,
  crushContact: string
) => {
  const logMessage = `
============================================================
🎉 🎉 🎉 IT'S A MATCH ON VIBEMATCH! 🎉 🎉 🎉
============================================================
A secret crush has been unlocked and matched!
Creator Name:   ${creatorName}
Creator Contact: ${creatorContact}
Matched Crush:  ${crushName}
Crush Contact:  ${crushContact}
Time of Match:  ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}
============================================================
`;
  console.log(logMessage);

  const smtpHost = process.env.SMTP_HOST;
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;

  if (smtpHost && smtpUser && smtpPass) {
    try {
      const transporter = nodemailer.createTransport({
        host: smtpHost,
        port: Number(process.env.SMTP_PORT) || 587,
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
          user: smtpUser,
          pass: smtpPass
        }
      });

      // Mail content for the confession creator
      const creatorMailOptions = {
        from: `"VibeMatch Alerts" <${smtpUser}>`,
        to: creatorContact.includes('@') ? creatorContact : undefined,
        subject: "🎉 It's a MATCH on VibeMatch!",
        text: `Hey ${creatorName}! Incredible news: your crush ${crushName} just confessed back to you on VibeMatch! Go text them!`,
        html: `
          <div style="font-family: sans-serif; padding: 20px; background-color: #0a0f1d; color: #ffffff; border-radius: 12px; max-width: 500px; border: 1px solid #ff2a5f;">
            <h2 style="color: #ff2a5f; margin-bottom: 5px;">🎉 It's a MATCH!</h2>
            <p style="font-size: 16px; margin-top: 0;">Hey <b>${creatorName}</b>,</p>
            <p style="font-size: 14px; line-height: 1.6; color: #cbd5e1;">
              Incredible news! Your crush <b>${crushName}</b> (${crushContact}) just filled out your secret confession link and guessed your name correctly. 
            </p>
            <div style="background-color: #121626; border: 1px solid rgba(255,255,255,0.05); padding: 15px; border-radius: 8px; margin: 20px 0; text-align: center;">
              <span style="font-size: 18px; font-weight: bold; color: #10b981;">Mutual Crush Confirmed! ⚡</span>
            </div>
            <p style="font-size: 13px; color: #94a3b8;">
              Go ahead, slide into their DMs! Make sure to mention the VibeMatch code. Good luck! 😉
            </p>
          </div>
        `
      };

      // Mail content for the crush
      const crushMailOptions = {
        from: `"VibeMatch Alerts" <${smtpUser}>`,
        to: crushContact.includes('@') ? crushContact : undefined,
        subject: "🎉 You have a Match on VibeMatch!",
        text: `Hey! You just matched with ${creatorName} (${creatorContact}) on VibeMatch! They set up the secret confession link.`,
        html: `
          <div style="font-family: sans-serif; padding: 20px; background-color: #0a0f1d; color: #ffffff; border-radius: 12px; max-width: 500px; border: 1px solid #a855f7;">
            <h2 style="color: #a855f7; margin-bottom: 5px;">🎉 It's a MATCH!</h2>
            <p style="font-size: 16px; margin-top: 0;">Hey there,</p>
            <p style="font-size: 14px; line-height: 1.6; color: #cbd5e1;">
              You just matched with <b>${creatorName}</b> (${creatorContact})! They are the one who sent you the anonymous crush query link.
            </p>
            <div style="background-color: #121626; border: 1px solid rgba(255,255,255,0.05); padding: 15px; border-radius: 8px; margin: 20px 0; text-align: center;">
              <span style="font-size: 18px; font-weight: bold; color: #10b981;">Mutual Crush Confirmed! ⚡</span>
            </div>
            <p style="font-size: 13px; color: #94a3b8;">
              Go text them now! Both of you have been matching. 😉
            </p>
          </div>
        `
      };

      if (creatorMailOptions.to) {
        await transporter.sendMail(creatorMailOptions);
      }
      if (crushMailOptions.to) {
        await transporter.sendMail(crushMailOptions);
      }
      console.log("📨 Match emails dispatched successfully.");
    } catch (error) {
      console.error("❌ Failed to dispatch match notification emails:", error);
    }
  }
};
