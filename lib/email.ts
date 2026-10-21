type OfficerApprovalEmail = {
  name: string;
  email: string;
};

export async function sendOfficerApprovalEmail({ name, email }: OfficerApprovalEmail) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM;
  const appUrl = process.env.APP_URL;

  if (!apiKey || !from || !appUrl) {
    throw new Error("RESEND_API_KEY, EMAIL_FROM, and APP_URL must be configured to send approval emails.");
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

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [email],
      subject: "Your MSWD officer account has been approved",
      text: `Hello ${name},\n\nYour MSWD officer account registration has been approved. You can now sign in using your registered email address and password:\n\n${loginUrl.toString()}\n\nMSWD Management System`,
    }),
  });

  if (!response.ok) {
    throw new Error(`Resend could not send the approval email (HTTP ${response.status}).`);
  }
}
