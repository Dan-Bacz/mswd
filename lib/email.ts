import nodemailer from "nodemailer";

type OfficerEmail = {
  name: string;
  email: string;
  position?: string | null;
  employeeId?: string | null;
};

function parseSenderAddress(value: string) {
  const unwrapped = value.trim().replace(/^(["'])(.*)\1$/, "$2").trim();
  const displayAddress = /^(?:"([^"]+)"|([^<>]+))\s*<([^<>]+)>$/.exec(unwrapped);
  const address = displayAddress ? displayAddress[3].trim() : unwrapped;
  const name = displayAddress ? (displayAddress[1] ?? displayAddress[2]).trim() : undefined;

  if (!/^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/.test(address) || (displayAddress && !name)) {
    throw new Error('EMAIL_FROM must be an email address or a display name and address, e.g. "Mahayag MSWD Office <office@gmail.com>".');
  }

  return { name, address };
}

function createTransport() {
  const host = process.env.SMTP_HOST;
  const portValue = process.env.SMTP_PORT;
  const user = process.env.SMTP_USER;
  const password = process.env.SMTP_PASSWORD;
  const from = process.env.EMAIL_FROM;
  const appUrl = process.env.APP_URL;

  if (!host || !portValue || !user || !password || !from || !appUrl) {
    throw new Error(
      "SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASSWORD, EMAIL_FROM, and APP_URL must be configured to send officer email notifications.",
    );
  }

  const port = Number(portValue);
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error("SMTP_PORT must be a valid port number.");
  }

  let baseUrl: URL;
  try {
    baseUrl = new URL(appUrl);
  } catch {
    throw new Error("APP_URL must be a valid absolute URL.");
  }

  if (baseUrl.protocol !== "https:" && baseUrl.protocol !== "http:") {
    throw new Error("APP_URL must use HTTP or HTTPS.");
  }

  return {
    transporter: nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: { user, pass: password },
      requireTLS: port !== 465,
    }),
    from: parseSenderAddress(from),
    baseUrl,
  };
}

export async function sendNewOfficerRegistrationEmail(
  admins: OfficerEmail[],
  officer: OfficerEmail,
) {
  if (admins.length === 0) {
    throw new Error("No active administrator email address is available for officer registration notifications.");
  }

  const { transporter, from, baseUrl } = createTransport();
  const managementUrl = new URL("/admin/officers", baseUrl).toString();

  await transporter.sendMail({
    from,
    to: admins.map(({ email }) => email),
    subject: "New MSWD officer registration awaiting approval",
    text: [
      "A new officer account registration is waiting for administrator review.",
      "",
      `Name: ${officer.name}`,
      `Position: ${officer.position ?? "Not provided"}`,
      `Employee ID: ${officer.employeeId ?? "Not provided"}`,
      `Email: ${officer.email}`,
      "",
      `Review registrations: ${managementUrl}`,
      "",
      "MSWD Management System",
    ].join("\n"),
  });
}

export async function sendOfficerApprovalEmail({ name, email }: OfficerEmail) {
  const { transporter, from, baseUrl } = createTransport();
  const loginUrl = new URL("/login", baseUrl).toString();

  await transporter.sendMail({
    from,
    to: email,
    subject: "Your MSWD officer account has been approved",
    text: `Hello ${name},\n\nYour MSWD officer account registration has been approved. You can now sign in using your registered email address and password:\n\n${loginUrl}\n\nMSWD Management System`,
  });
}

export async function sendOfficerCategoryAssignmentEmail({ name, email, categories }: OfficerEmail & { categories: string[] }) {
  const { transporter, from, baseUrl } = createTransport();
  const dashboardUrl = new URL("/officer/select-category", baseUrl).toString();
  const categoryList = categories.length > 0 ? categories.map((category) => `- ${category}`).join("\n") : "- No categories currently assigned";

  await transporter.sendMail({
    from,
    to: email,
    subject: "Your MSWD category assignments have been updated",
    text: `Hello ${name},\n\nThe MSWD administrator updated the categories assigned to your account:\n\n${categoryList}\n\nSign in to choose the category dashboard you want to open:\n${dashboardUrl}\n\nMSWD Management System`,
  });
}

export async function sendOfficerRejectionEmail({ name, email }: OfficerEmail) {
  const { transporter, from } = createTransport();

  await transporter.sendMail({
    from,
    to: email,
    subject: "Update on your MSWD officer account registration",
    text: `Hello ${name},\n\nYour MSWD officer account registration was not approved. If you would like to discuss this decision, please contact the MSWD Office.\n\nMSWD Management System`,
  });
}

export async function sendOfficerDeactivationEmail({ name, email }: OfficerEmail) {
  const { transporter, from } = createTransport();

  await transporter.sendMail({
    from,
    to: email,
    subject: "Your MSWD officer account has been deactivated",
    text: `Hello ${name},\n\nYour MSWD officer account has been deactivated by an administrator. You can no longer sign in to or access the MSWD Management System. If you believe this was done in error, please contact the MSWD Office.\n\nMSWD Management System`,
  });
}
