import nodemailer from 'nodemailer';

export async function POST(req) {
  const { name, email, phone, subject, message } = await req.json();

  // Use separate SMTP credentials for contact form
  const transporter = nodemailer.createTransport({
    host: 'smtp.hostinger.com',
    port: 465,
    secure: true, // true for port 465
    auth: {
      user: process.env.CONTACT_EMAIL_USER, // e.g. contact@rabbitautocare.com
      pass: process.env.CONTACT_EMAIL_PASS, // password for contact email
    },
  });

  const mailOptions = {
    from: process.env.CONTACT_EMAIL_USER, // send from the contact email
    to: process.env.CONTACT_ADMIN_EMAIL,
    subject: `Contact Form: ${subject}`,
    text: `Name: ${name}\nEmail: ${email}\nPhone: ${phone}\nMessage: ${message}`,
    html: `
      <div style="font-family: 'Segoe UI', Arial, sans-serif; background: #fafbfc; padding: 32px; border-radius: 12px; max-width: 480px; margin: 0 auto; color: #222;">
        <h2 style="color: #601E8D; margin-bottom: 16px;">New Contact Form Submission</h2>
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="font-weight: 600; padding: 8px 0; width: 120px;">Name:</td>
            <td style="padding: 8px 0;">${name}</td>
          </tr>
          <tr>
            <td style="font-weight: 600; padding: 8px 0;">Email:</td>
            <td style="padding: 8px 0;">${email}</td>
          </tr>
          <tr>
            <td style="font-weight: 600; padding: 8px 0;">Phone:</td>
            <td style="padding: 8px 0;">${phone}</td>
          </tr>
          <tr>
            <td style="font-weight: 600; padding: 8px 0;">Subject:</td>
            <td style="padding: 8px 0;">${subject}</td>
          </tr>
          <tr>
            <td style="font-weight: 600; padding: 8px 0; vertical-align: top;">Message:</td>
            <td style="padding: 8px 0; white-space: pre-line;">${message}</td>
          </tr>
        </table>
        <div style="margin-top: 32px; font-size: 13px; color: #888; text-align: center;">
          <span>Rabbit Auto Care &mdash; Contact Form</span>
        </div>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (error) {
    return new Response(JSON.stringify({ success: false, error: error.message }), { status: 500 });
  }
}
