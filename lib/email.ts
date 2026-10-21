import nodemailer from "nodemailer";

type OfficerApprovalEmail = {
  name: string;
  email: string;
};

export async function sendOfficerApprovalEmail({ name, email }: OfficerApprovalEmail) {
  const host = process.env.SMTP_HOST;
  const portValue = process.env.SMTP_PORT;
  const user = process.env.SMTP_USER;
  const password = process.env.SMTP_PASSWORD;
  const from = process.env.EMAIL_FROM;
  const appUrl = process.env.APP_URL;

  if (!host || !portValue || !user || !password || !from || !appUrl) {
    throw new Error(
      "SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASSWORD, EMAIL_FROM, and APP_URL must be configured to send approval emails.",
    );
  }

  const port = Number(portValue);
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error("SMTP_PORT must be a valid port number.");
  }

  let loginUrl: URL;
  try {
    loginUrl = new URL("/login", appUrl);
  } catch {
    throw new Error("APP_URL must be a valid absolute URL.");
  }

  if (loginUrl.protocol !== "https:" && loginUrl.protocol !== "http:") {
    throw new Error("APP_URL must use HTTP or HTTPS.");
  }

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass: password },
    requireTLS: port !== 465,
  });

  await transporter.sendMail({
    from,
    to: email,
    subject: "Your MSWD officer account has been approved",
    text: `Hello ${name},\n\nYour MSWD officer account registration has been approved. You can now sign in using your registered email address and password:\n\n${loginUrl.toString()}\n\nMSWD Management System`,
  });
}
