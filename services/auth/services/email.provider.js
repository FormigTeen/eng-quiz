"use strict";

/**
 * Email Provider Interface
 * Define a contract for email sending implementations
 */
class EmailProvider {
  /**
   * Send an invite email
   * @param {string} toEmail - Recipient email address
   * @param {string} fromEmail - Sender email address
   * @returns {Promise<void>}
   */
  async sendInvite(toEmail, fromEmail) {
    throw new Error("sendInvite must be implemented by subclass");
  }

  /**
   * Send a forgot password email with temporary password
   * @param {string} toEmail - Recipient email address
   * @param {string} tempPassword - Temporary password to send
   * @returns {Promise<void>}
   */
  async sendForgotPassword(toEmail, tempPassword) {
    throw new Error("sendForgotPassword must be implemented by subclass");
  }
}

module.exports = EmailProvider;

