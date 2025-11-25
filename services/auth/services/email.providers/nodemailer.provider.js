"use strict";

const nodemailer = require("nodemailer");
const EmailProvider = require("../email.provider");

/**
 * Nodemailer implementation of EmailProvider
 * Uses nodemailer library to send emails via SMTP
 */
class NodemailerProvider extends EmailProvider {
  constructor(config) {
    super();
    this.config = config;
    this.transporter = null;
  }

  /**
   * Initialize the transporter with SMTP configuration
   */
  _getTransporter() {
    if (!this.transporter) {
      const { host, port, user, pass, from } = this.config;
      
      if (!host || !user || !pass) {
        throw new Error("SMTP env not fully configured");
      }

      // Normalize hostname: brevo.com -> sendinblue.com (certificado SSL válido apenas para sendinblue.com)
      let normalizedHost = host;
      const hostnameChanged = host.includes('brevo.com');
      if (hostnameChanged) {
        normalizedHost = host.replace('brevo.com', 'sendinblue.com');
      }

      this.transporter = nodemailer.createTransport({
        host: normalizedHost,
        port: port || 587,
        secure: false,
        auth: { user, pass },
        // Ignorar verificação de hostname apenas quando o hostname foi normalizado
        // para resolver problema de certificado SSL (brevo.com -> sendinblue.com)
        tls: hostnameChanged ? {
          rejectUnauthorized: true,
          checkServerIdentity: () => undefined
        } : undefined
      });
    }
    return this.transporter;
  }

  /**
   * Send an invite email
   * @param {string} toEmail - Recipient email address
   * @param {string} fromEmail - Sender email address (optional, uses config.from if not provided)
   */
  async sendInvite(toEmail, fromEmail) {
    const transporter = this._getTransporter();
    const from = fromEmail || this.config.from || this.config.user;
    
    await transporter.sendMail({
      from,
      to: toEmail,
      subject: "Convite de Teste ENG QUIZ",
      text: "Convite de Teste ENG QUIZ"
    });
  }

  /**
   * Send a forgot password email with temporary password
   * @param {string} toEmail - Recipient email address
   * @param {string} tempPassword - Temporary password to send
   */
  async sendForgotPassword(toEmail, tempPassword) {
    const transporter = this._getTransporter();
    const from = this.config.from || this.config.user;

    const emailText = `Olá,\n\nVocê solicitou a recuperação de senha no Soccer Quiz.\n\nSua senha temporária é: ${tempPassword}\n\nPor favor, faça login com esta senha e altere-a para uma senha segura.\n\nAtenciosamente,\nEquipe Soccer Quiz`;

    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Recuperação de Senha - Soccer Quiz</h2>
        <p>Olá,</p>
        <p>Você solicitou a recuperação de senha no Soccer Quiz.</p>
        <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <p style="margin: 0; font-size: 18px; font-weight: bold; color: #333;">Sua senha temporária é:</p>
          <p style="margin: 10px 0 0 0; font-size: 24px; font-family: monospace; color: #e53935;">${tempPassword}</p>
        </div>
        <p>Por favor, faça login com esta senha e altere-a para uma senha segura.</p>
        <p>Atenciosamente,<br>Equipe Soccer Quiz</p>
      </div>
    `;

    await transporter.sendMail({
      from,
      to: toEmail,
      subject: "Recuperação de Senha - Soccer Quiz",
      text: emailText,
      html: emailHtml
    });
  }
}

module.exports = NodemailerProvider;

