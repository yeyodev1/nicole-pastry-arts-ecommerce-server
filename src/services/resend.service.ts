import { Resend } from 'resend';

export class ResendService {
  private resend: Resend;

  constructor() {
    this.resend = new Resend(process.env.RESEND_API_KEY);
  }

  async sendEmail(
    to: string,
    subject: string,
    htmlContent: string,
    from: string = 'onboarding@resend.dev'
  ) {
    try {
      const { data, error } = await this.resend.emails.send({
        from,
        to,
        subject,
        html: htmlContent,
      });

      return data;
    } catch (error) {
      console.error('Error sending email:', error);
      throw error;
    }
  }
}
