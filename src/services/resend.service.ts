import 'dotenv/config'
import { Resend } from 'resend';
import { generateVerificationEmailTemplate, VerificationEmailData } from '../emails/verification-email.template';

export class ResendService {
  private resend: Resend;
  private readonly FROM_EMAIL: string;

  constructor() {
    this.resend = new Resend(process.env.RESEND_API_KEY);
    // TODO: Change to 'noreply@nicole.com.ec' when domain is configured
    this.FROM_EMAIL = process.env.FROM_EMAIL || 'onboarding@resend.dev';
  }

  async sendEmail(
    to: string,
    subject: string,
    htmlContent: string,
    from?: string
  ) {
    try {
      const { data, error } = await this.resend.emails.send({
        from: from || this.FROM_EMAIL,
        to,
        subject,
        html: htmlContent,
      });

      if (error) {
        console.error('Resend API error:', error);
        throw new Error(`Failed to send email: ${error.message}`);
      }

      return data;
    } catch (error) {
      console.error('Error sending email:', error);
      throw error;
    }
  }

  async sendVerificationEmail(
    to: string,
    firstName: string,
    verificationToken: string
  ) {
    try {
      const baseUrl = process.env.FRONTEND_URL || 'https://nicole.com.ec';
      const verificationUrl = `${baseUrl}/verify-email?token=${verificationToken}`;

      const emailData: VerificationEmailData = {
        firstName,
        verificationToken,
        verificationUrl
      };

      const htmlContent = generateVerificationEmailTemplate(emailData);

      const { data, error } = await this.resend.emails.send({
        from: `Nicole Pastry Arts <${this.FROM_EMAIL}>`,
        to,
        subject: '🍰 Verifica tu cuenta - Nicole Pastry Arts',
        html: htmlContent,
      });

      if (error) {
        console.error('Resend API error:', error);
        throw new Error(`Failed to send verification email: ${error.message}`);
      }

      console.log('Verification email sent successfully to:', to);
      return data;
    } catch (error) {
      console.error('Error sending verification email:', error);
      throw error;
    }
  }

  async sendWelcomeEmail(
    to: string,
    firstName: string
  ) {
    try {
      const htmlContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #812a73 0%, #9a3485 100%); padding: 30px; text-align: center; color: white;">
            <h1 style="margin: 0; font-size: 28px;">¡Bienvenido/a a Nicole Pastry Arts!</h1>
          </div>
          <div style="padding: 30px; background-color: #ffffff;">
            <h2 style="color: #812a73;">¡Hola ${firstName}!</h2>
            <p style="color: #1a1a1a; line-height: 1.6;">
              ¡Tu cuenta ha sido verificada exitosamente! Ahora puedes disfrutar de todos nuestros productos artesanales.
            </p>
            <p style="color: #1a1a1a; line-height: 1.6;">
              Explora nuestra colección de pasteles, postres y dulces hechos con amor y los mejores ingredientes.
            </p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="https://nicole.com.ec" style="background: linear-gradient(135deg, #812a73 0%, #9a3485 100%); color: white; text-decoration: none; padding: 15px 30px; border-radius: 8px; font-weight: bold;">
                Explorar productos
              </a>
            </div>
          </div>
          <div style="background-color: #f6f1ee; padding: 20px; text-align: center; color: #666666;">
            <p>© ${new Date().getFullYear()} Nicole Pastry Arts - nicole.com.ec</p>
          </div>
        </div>
      `;

      const { data, error } = await this.resend.emails.send({
        from: `Nicole Pastry Arts <${this.FROM_EMAIL}>`,
        to,
        subject: '🎉 ¡Cuenta verificada! - Nicole Pastry Arts',
        html: htmlContent,
      });

      if (error) {
        console.error('Resend API error:', error);
        throw new Error(`Failed to send welcome email: ${error.message}`);
      }

      console.log('Welcome email sent successfully to:', to);
      return data;
    } catch (error) {
      console.error('Error sending welcome email:', error);
      throw error;
    }
  }
}
