import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

const SMTP_HOST = process.env.SMTP_HOST || "smtp.gmail.com";
const SMTP_PORT = Number(process.env.SMTP_PORT || "587");
const SMTP_USER = process.env.SMTP_USER || "";
const SMTP_PASS = process.env.SMTP_PASS || "";

export async function sendVerificationEmail(toEmail: string, code: string) {
  if (!SMTP_USER || !SMTP_PASS) {
    console.log("\n=======================================================");
    console.log(`[DEV MODE] Verification Code for ${toEmail}: ${code}`);
    console.log("=======================================================\n");
    return;
  }

  const transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: SMTP_PORT,
    secure: SMTP_PORT === 465,
    auth: {
      user: SMTP_USER,
      pass: SMTP_PASS,
    },
  });

  const mailOptions = {
    from: `"secondServe Security" <${SMTP_USER}>`,
    to: toEmail,
    subject: "secondServe - Email Verification Code",
    html: `
      <div style="font-family: sans-serif; max-width: 500px; margin: 0 auto; padding: 20px; border: 1px solid #1e293b; border-radius: 16px; background-color: #020617; color: #f1f5f9;">
        <h2 style="color: #22d3ee; margin-bottom: 20px; font-weight: bold;">Verify your secondServe account</h2>
        <p style="font-size: 14px; color: #94a3b8; line-height: 1.6;">Welcome to secondServe! To complete your registration or verify your identity, please use the 6-digit verification code below:</p>
        <div style="background-color: #0f172a; border: 1px solid #1e293b; padding: 15px; border-radius: 12px; font-size: 32px; font-weight: bold; text-align: center; color: #22d3ee; letter-spacing: 6px; margin: 25px 0;">
          ${code}
        </div>
        <p style="font-size: 12px; color: #64748b; margin-top: 20px;">This code is valid for 15 minutes. If you did not request this code, please ignore this email.</p>
        <hr style="border-color: #1e293b; margin: 25px 0;" />
        <p style="font-size: 10px; color: #475569; text-align: center;">secondServe Platform &copy; 2026</p>
      </div>
    `,
  };

  await transporter.sendMail(mailOptions);
}
