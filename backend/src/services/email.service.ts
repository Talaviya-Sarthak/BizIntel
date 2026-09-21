import nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';
import { env } from '../config/env';
import { logger } from '../config/logger';

let transporterInstance: Transporter | null = null;

/**
 * Creates or retrieves the singleton Nodemailer transporter.
 * Supports Gmail SMTP with direct App Password authentication or OAuth2.
 */
function getTransporter(): Transporter | null {
  if (transporterInstance) {
    return transporterInstance;
  }

  if (!env.EMAIL_USER) {
    logger.warn('EMAIL_USER is not configured. Email dispatch will be skipped.');
    return null;
  }

  try {
    if (env.EMAIL_PASSWORD) {
      transporterInstance = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: env.EMAIL_USER,
          pass: env.EMAIL_PASSWORD,
        },
      });
      logger.info('Initialized Gmail email transporter via App Password');
    } else if (env.CLIENT_ID && env.CLIENT_SECRET && env.REFRESH_TOKEN) {
      transporterInstance = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          type: 'OAuth2',
          user: env.EMAIL_USER,
          clientId: env.CLIENT_ID,
          clientSecret: env.CLIENT_SECRET,
          refreshToken: env.REFRESH_TOKEN,
        },
      });
      logger.info('Initialized Gmail email transporter via OAuth2');
    } else {
      logger.warn('Neither EMAIL_PASSWORD nor OAuth2 credentials configured for email service.');
      return null;
    }

    return transporterInstance;
  } catch (error) {
    logger.error({ err: error }, 'Failed to initialize email transporter');
    return null;
  }
}

/**
 * Generates the responsive HTML email template for new account registration.
 */
function generateWelcomeEmailHtml(name: string, email: string): string {
  const loginUrl = `${env.FRONTEND_URL}/signin`;
  const dashboardUrl = `${env.FRONTEND_URL}/dashboard`;
  const safeName = name ? name.trim() : 'there';

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to BizIntel Enterprise</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      background-color: #090a0f;
      color: #e4e4e7;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      -webkit-font-smoothing: antialiased;
    }
    table {
      border-collapse: collapse;
    }
    a {
      color: #34d399;
      text-decoration: none;
    }
    .btn {
      display: inline-block;
      background-color: #ffffff;
      color: #09090b !important;
      font-weight: 700;
      font-size: 14px;
      padding: 12px 28px;
      border-radius: 9999px;
      text-decoration: none;
      box-shadow: 0 0 25px rgba(255, 255, 255, 0.2);
    }
    .card {
      background-color: #12131a;
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 16px;
      padding: 24px;
    }
    .feature-item {
      background-color: rgba(255, 255, 255, 0.03);
      border: 1px solid rgba(255, 255, 255, 0.06);
      border-radius: 12px;
      padding: 16px;
      margin-bottom: 12px;
    }
  </style>
</head>
<body style="margin: 0; padding: 32px 16px; background-color: #090a0f;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" align="center">
    <tr>
      <td align="center">
        <!-- Main Card Container -->
        <table role="presentation" width="100%" style="max-width: 600px; background-color: #0d0e15; border: 1px solid rgba(255, 255, 255, 0.12); border-radius: 20px; overflow: hidden; box-shadow: 0 20px 50px rgba(0,0,0,0.8);" cellspacing="0" cellpadding="0" border="0">
          
          <!-- Top Header Accent Banner -->
          <tr>
            <td style="background: linear-gradient(90deg, #10b981 0%, #06b6d4 50%, #d2f831 100%); height: 4px;"></td>
          </tr>

          <!-- Brand Header -->
          <tr>
            <td style="padding: 36px 36px 20px 36px; text-align: center;">
              <div style="display: inline-block; padding: 6px 16px; border-radius: 9999px; background: rgba(255, 255, 255, 0.06); border: 1px solid rgba(255, 255, 255, 0.12); margin-bottom: 16px;">
                <span style="font-size: 11px; font-family: monospace; text-transform: uppercase; letter-spacing: 0.2em; color: #34d399; font-weight: 700;">• BIZINTEL ENTERPRISE •</span>
              </div>
              <h1 style="margin: 0; font-size: 28px; font-weight: 900; letter-spacing: 0.15em; color: #ffffff; text-transform: uppercase;">
                B I Z I N T E L
              </h1>
              <p style="margin: 6px 0 0 0; font-size: 12px; font-family: monospace; letter-spacing: 0.3em; text-transform: uppercase; color: #a1a1aa;">
                Enterprise Intelligence Platform
              </p>
            </td>
          </tr>

          <!-- Welcome Message -->
          <tr>
            <td style="padding: 0 36px 24px 36px;">
              <div style="background-color: #13141d; border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 16px; padding: 28px;">
                <h2 style="margin: 0 0 12px 0; font-size: 20px; font-weight: 700; color: #f4f4f5;">
                  Welcome to BizIntel, ${safeName}! 👋
                </h2>
                <p style="margin: 0 0 18px 0; font-size: 14px; line-height: 1.6; color: #d4d4d8;">
                  Your enterprise account has been created successfully for <strong style="color: #ffffff;">${email}</strong>. You now have access to a unified environment for quantitative research, data analytics, and AI decision support.
                </p>

                <!-- 3 Capability Cards -->
                <div style="margin-top: 20px;">
                  
                  <table role="presentation" width="100%" style="background-color: rgba(255, 255, 255, 0.03); border: 1px solid rgba(255, 255, 255, 0.06); border-radius: 12px; margin-bottom: 10px; padding: 12px 16px;" cellspacing="0" cellpadding="0">
                    <tr>
                      <td width="32" valign="top" style="padding-right: 12px; font-size: 18px;">📈</td>
                      <td>
                        <div style="font-size: 13px; font-weight: 700; color: #ffffff; margin-bottom: 2px;">Quantitative Strategy Backtesting</div>
                        <div style="font-size: 12px; color: #a1a1aa; line-height: 1.4;">Execute lookahead-bias-free historical backtests and evaluate risk-adjusted CAGR benchmarks.</div>
                      </td>
                    </tr>
                  </table>

                  <table role="presentation" width="100%" style="background-color: rgba(255, 255, 255, 0.03); border: 1px solid rgba(255, 255, 255, 0.06); border-radius: 12px; margin-bottom: 10px; padding: 12px 16px;" cellspacing="0" cellpadding="0">
                    <tr>
                      <td width="32" valign="top" style="padding-right: 12px; font-size: 18px;">⚡</td>
                      <td>
                        <div style="font-size: 13px; font-weight: 700; color: #ffffff; margin-bottom: 2px;">Real-Time DataMart SQL Analytics</div>
                        <div style="font-size: 12px; color: #a1a1aa; line-height: 1.4;">Transform raw datasets into high-performance analytical queries and interactive KPI dashboards powered by DuckDB.</div>
                      </td>
                    </tr>
                  </table>

                  <table role="presentation" width="100%" style="background-color: rgba(255, 255, 255, 0.03); border: 1px solid rgba(255, 255, 255, 0.06); border-radius: 12px; padding: 12px 16px;" cellspacing="0" cellpadding="0">
                    <tr>
                      <td width="32" valign="top" style="padding-right: 12px; font-size: 18px;">🤖</td>
                      <td>
                        <div style="font-size: 13px; font-weight: 700; color: #ffffff; margin-bottom: 2px;">Retail AI Decision Assistant</div>
                        <div style="font-size: 12px; color: #a1a1aa; line-height: 1.4;">Ask questions in natural language and receive dataset-aware, explainable insights and anomaly detection.</div>
                      </td>
                    </tr>
                  </table>

                </div>

                <!-- Call to Action Button -->
                <div style="text-align: center; margin-top: 32px; margin-bottom: 8px;">
                  <a href="${dashboardUrl}" class="btn" style="display: inline-block; background-color: #ffffff; color: #09090b !important; font-weight: 700; font-size: 13px; padding: 12px 32px; border-radius: 9999px; text-decoration: none;">
                    Open Workspace Console →
                  </a>
                </div>

              </div>
            </td>
          </tr>

          <!-- Footer Information -->
          <tr>
            <td style="padding: 0 36px 32px 36px; text-align: center;">
              <p style="margin: 0 0 8px 0; font-size: 11px; color: #71717a;">
                Need help or have questions? Contact our team at <a href="mailto:support@bizintel.io" style="color: #34d399;">support@bizintel.io</a>.
              </p>
              <p style="margin: 0; font-size: 11px; color: #52525b; font-family: monospace;">
                © ${new Date().getFullYear()} BizIntel Inc. • All Systems Operational • End-to-End Encrypted
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

/**
 * Generates plaintext fallback version of the welcome email.
 */
function generateWelcomeEmailText(name: string, email: string): string {
  const safeName = name ? name.trim() : 'there';
  const loginUrl = `${env.FRONTEND_URL}/signin`;
  const dashboardUrl = `${env.FRONTEND_URL}/dashboard`;

  return `
Welcome to BizIntel Enterprise, ${safeName}!

Your account has been created successfully for ${email}.

Unified Capabilities:
- Quantitative Strategy Backtesting: Run bias-free backtests and CAGR benchmarks.
- Real-Time DataMart SQL Analytics: Query raw datasets and build KPI dashboards.
- Retail AI Decision Assistant: Natural language analytics and explainable insights.

Access your Workspace Console:
${dashboardUrl}

Or sign in anytime:
${loginUrl}

If you have any questions, contact us at support@bizintel.io.

© ${new Date().getFullYear()} BizIntel Inc. All rights reserved.
  `.trim();
}

/**
 * Sends a welcome email to the newly registered user.
 * This operation is asynchronous and non-blocking.
 */
export async function sendWelcomeEmail(to: string, name: string): Promise<boolean> {
  const transporter = getTransporter();

  if (!transporter) {
    logger.warn({ to }, 'Email transporter not available; skipping welcome email dispatch.');
    return false;
  }

  const mailOptions = {
    from: env.EMAIL_FROM || `BizIntel Enterprise <${env.EMAIL_USER}>`,
    to,
    subject: 'Welcome to BizIntel - Your Enterprise Intelligence Workspace',
    text: generateWelcomeEmailText(name, to),
    html: generateWelcomeEmailHtml(name, to),
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    logger.info(
      { to, messageId: info.messageId, response: info.response },
      'Successfully sent welcome email to newly registered user',
    );
    return true;
  } catch (error) {
    logger.error(
      { err: error, to },
      'Failed to send welcome email to newly registered user',
    );
    return false;
  }
}
