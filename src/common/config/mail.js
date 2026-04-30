import nodemailer from "nodemailer";
import ApiError from "../utils/api-error.js";

let transporter;
const nodeEnv = process.env.NODE_ENV || process.env.NODE_env || "development";
const mailProvider = (
  process.env.MAIL_PROVIDER ||
  (nodeEnv === "development" ? "mailtrap" : "brevo")
).toLowerCase();

const appName = process.env.APP_NAME || "ZohoCine";
const isApiProvider = ["api", "brevo-api", "brevo_api"].includes(mailProvider);

const getAppUrl = () => {
    return process.env.APP_URL || `http://localhost:${process.env.PORT || 5000}`;
}

// const getClientUrl = () => {
//     return process.env.CLIENT_URL || process.env.FRONTEND_URL || getAppUrl();
// };//it will be useful when i am creating full service with frontend integrated

const createLink = (baseUrl, path) => {
    return `${baseUrl.replace(/\/$/, "")}${path}`;
};
// This avoids double slashes.

// If .env has:

// APP_URL=http://localhost:5000/
// and path is:

// /api/auth/verify-email/token

const createHtmlLayout = ({ title, message, buttonText, buttonUrl, footerText }) => {
    return `
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${title}</title>
  </head>
  <body style="margin:0; padding:0; background-color:#f5f7fb; font-family:Arial, Helvetica, sans-serif; color:#222;">
    <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background-color:#f5f7fb; padding:32px 16px;">
      <tr>
        <td align="center">
          <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="max-width:560px; background-color:#ffffff; border:1px solid #e5e7eb; border-radius:8px;">
            <tr>
              <td style="padding:22px 28px; border-bottom:1px solid #e5e7eb;">
                <h2 style="margin:0; font-size:20px; color:#111827;">${appName}</h2>
              </td>
            </tr>

            <tr>
              <td style="padding:28px;">
                <h1 style="margin:0 0 16px; font-size:24px; line-height:1.3; color:#111827;">${title}</h1>

                <div style="font-size:16px; line-height:1.6; color:#374151;">
                  ${message}
                </div>

                <div style="margin:28px 0;">
                  <a href="${buttonUrl}" target="_blank" style="display:inline-block; background-color:#2563eb; color:#ffffff; padding:12px 18px; border-radius:6px; text-decoration:none; font-size:15px; font-weight:bold;">
                    ${buttonText}
                  </a>
                </div>

                <p style="margin:0 0 8px; font-size:14px; line-height:1.5; color:#6b7280;">
                  If the button does not work, copy and paste this link into your browser:
                </p>

                <p style="margin:0; font-size:14px; line-height:1.5; word-break:break-all;">
                  <a href="${buttonUrl}" target="_blank" style="color:#2563eb;">${buttonUrl}</a>
                </p>
              </td>
            </tr>

            <tr>
              <td style="padding:18px 28px; background-color:#f9fafb; border-top:1px solid #e5e7eb; border-radius:0 0 8px 8px;">
                <p style="margin:0; font-size:13px; line-height:1.5; color:#6b7280;">
                  ${footerText}
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
};

const createVerificationEmail = (token) => {
    const verificationUrl = createLink(getAppUrl(), `/verify-email.html?token=${token}`);

    return {
        subject: `Verify your ${appName} email`,
        html: createHtmlLayout({
            title: "Verify your email",
            message: `
            <p style="margin:0 0 12px;">Hello,</p>
            <p style="margin:0;">Thanks for creating an account with ${appName}. Please verify your email address to activate your account.</p>
            `,
            buttonText: "Verify Email",
            buttonUrl: verificationUrl,
            footerText: `If you did not create an account with ${appName}, you can ignore this email.`,
        }),
        text: `
Verify your ${appName} email

Thanks for creating an account with ${appName}.
Please verify your email address using this link:

${verificationUrl}

If you did not create this account, you can ignore this email.
        `.trim(),
    };
};

const createResetPasswordEmail = (token) => {
    const resetUrl = createLink(getAppUrl(), `/reset-password.html?token=${encodeURIComponent(token)}`);
    // token often include characters that would break or change a URL; encoding preserves the exact token value.
    // Example: encodeURIComponent("a+b/c==") → "a%2Bb%2Fc%3D%3D".
    // On the server the URL component will be decoded back (so req.params/req.query contains the original token). thats why using encodeURIComponent
    return {
        subject: `Reset your ${appName} password`,
        html: createHtmlLayout({
            title: "Reset your password",
            message: `
            <p style="margin:0 0 12px;">Hello,</p>
            <p style="margin:0;">We received a request to reset your password. Click the button below to create a new password.</p>
            <p style="margin:12px 0 0;">This link will expire in 15 minutes.</p>
            `,
            buttonText: "Reset Password",
            buttonUrl: resetUrl,
            footerText: "If you did not request a password reset, you can ignore this email.",
        }),
        text: `
Reset your ${appName} password

We received a request to reset your password.
Use this link to create a new password:

${resetUrl}

This link will expire in 15 minutes.
If you did not request a password reset, you can ignore this email.
        `.trim(),
    };
};

const createSmtpTransport = ({ host, port, user, pass }) =>
  nodemailer.createTransport({
    host,
    port: Number(port),
    secure: Number(port) === 465, // STARTTLS on 587, SSL/TLS on 465
    auth: { user, pass },
    connectionTimeout: 15000,
    greetingTimeout: 10000,
    socketTimeout: 20000,
  });

const sendWithBrevoApi = async ({ to, subject, html, text }) => {
  const apiKey = process.env.BREVO_API_KEY;
  const senderEmail = process.env.MAIL_FROM || process.env.BREVO_SENDER_EMAIL || process.env.BREVO_USER;

  if (!apiKey) {
    throw ApiError.badRequest("BREVO_API_KEY is required");
  }

  if (!senderEmail) {
    throw ApiError.badRequest("MAIL_FROM or BREVO_SENDER_EMAIL is required");
  }

  const response = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: {
      "accept": "application/json",
      "content-type": "application/json",
      "api-key": apiKey,
    },
    body: JSON.stringify({
      sender: { name: appName, email: senderEmail },
      to: [{ email: to }],
      subject,
      htmlContent: html,
      textContent: text,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw ApiError.badRequest(`Brevo API send failed: ${response.status} ${errorText}`);
  }

  const data = await response.json();
  console.log(`Email has been sent to ${data?.messageId || to}`);
};

const getTransporter = () => {

    if(transporter) return transporter;
    if (isApiProvider) return null;
    if (mailProvider === "mailtrap") {
      transporter = createSmtpTransport({
        host: process.env.MAILTRAP_HOST,
        port: process.env.MAILTRAP_PORT,
        user: process.env.MAILTRAP_USER,
        pass: process.env.MAILTRAP_PASSWORD,
      });
    } else if (mailProvider === "gmail") {
      transporter = createSmtpTransport({
        host: process.env.GMAIL_HOST || "smtp.gmail.com",
        port: process.env.GMAIL_PORT || 587,
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_PASSWORD,
      });
    } else {
      // Recommended production default (Brevo free tier).
      transporter = createSmtpTransport({
        host: process.env.BREVO_HOST || "smtp-relay.brevo.com",
        port: process.env.BREVO_PORT || 587,
        user: process.env.BREVO_USER,
        pass: process.env.BREVO_PASSWORD,
      });
    }

    return transporter;
};

const verifyTransporter = async () => {
    try {
        if (isApiProvider) {
          if (!process.env.BREVO_API_KEY) {
            throw ApiError.badRequest("BREVO_API_KEY is required");
          }
          return;
        }
        await getTransporter().verify();
        console.log("Server is ready to take our messages");
    } catch (error) {
        throw ApiError.badRequest(`verification failed : ${error.message}`);
    }
}

const sendEmail = async ({to,subject,html,text}) => {
    if (isApiProvider) {
      await sendWithBrevoApi({ to, subject, html, text });
      return;
    }

    const from =
      mailProvider === "mailtrap"
        ? process.env.MAILTRAP_USER
        : mailProvider === "gmail"
          ? process.env.GMAIL_USER
          : process.env.BREVO_USER;
    const info = await getTransporter().sendMail({
        from : `"${appName}" <${from}>`,
        to,
        subject,
        html,
        text,
    });
    console.log(`Email has been sent to ${info.messageId}`);
}

const verificationEmail = async (userMail, token) => {
    const email = createVerificationEmail(token);

    await sendEmail({
        to : userMail,
        subject : email.subject,
        html : email.html,
        text : email.text,
    });
}

const resetPasswordEmail = async (userMail, token) => {
    const email = createResetPasswordEmail(token);

    await sendEmail({
        to : userMail,
        subject : email.subject,
        html : email.html,
        text : email.text,
    });
}

export {
    verifyTransporter,
    sendEmail,
    verificationEmail,
    resetPasswordEmail,
};

