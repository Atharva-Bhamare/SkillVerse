
import nodemailer from "nodemailer";

import config from "../config/env.js";
import logger from "../config/logger.js";

const transporter = nodemailer.createTransport({
  host: config.smtpHost,
  port: config.smtpPort,
  secure: config.smtpPort === 465,
  auth: {
    user: config.smtpUser,
    pass: config.smtpPass,
  },
});

export const verifyEmailConnection = async () => {
  try {
    await transporter.verify();

    logger.info("Email service connected successfully to SMTP server.");

    return true;
  } catch (error) {
    logger.error("Email service SMTP connection failed.", {
      code: error.code,
      command: error.command,
    });

    throw new Error("Unable to connect to the email server.");
  }
};

export const sendEmail = async ({
  to,
  subject,
  text,
  html,
}) => {
  try {
    if (!to || !subject || (!text && !html)) {
      throw new Error(
        "Recipient, subject and email content are required."
      );
    }

    const info = await transporter.sendMail({
      from: config.emailFrom,
      to,
      subject,
      text,
      html,
    });

    logger.info("Email sent successfully.", {
      messageId: info.messageId,
      recipient: to,
    });

    return {
      messageId: info.messageId,
      accepted: info.accepted,
    };
  } catch (error) {
    logger.error("Email delivery failed.", {
      code: error.code,
      command: error.command,
      recipient: to,
    });

    throw error;
  }
};

const emailService = {
  verifyEmailConnection,
  sendEmail,
};

export default emailService;
