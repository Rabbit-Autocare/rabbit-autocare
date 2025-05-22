import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  secure: true,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { to, order, shipping, email } = req.body;

  try {
    const itemsList = order.items.map(
      item => `<li>${item.name} (x${item.quantity}) - ₹${parseFloat(item.price).toFixed(2)}</li>`
    ).join('');

    // 1. Send to user
    await transporter.sendMail({
      from: `"My Shop" <${process.env.SMTP_USER}>`,
      to,
      subject: 'Order Confirmation',
      text: `Thank you for your order, ${shipping.full_name}. Total: ₹${order.total}`,
      html: `
        <h1>Thanks for your order!</h1>
        <p>Hi ${shipping.full_name},</p>
        <p>We've received your order:</p>
        <ul>${itemsList}</ul>
        <p><strong>Total:</strong> ₹${order.total}</p>
        <p>We’ll ship it to: ${shipping.street}, ${shipping.city}, ${shipping.state} - ${shipping.postal_code}</p>
      `,
    });

    // 2. Send to admin
    await transporter.sendMail({
      from: `"Order Bot" <${process.env.SMTP_USER}>`,
      to: process.env.ADMIN_EMAIL,
      subject: 'New Order Received',
      text: `New order by ${shipping.full_name}. Total: ₹${order.total}`,
      html: `
        <h2>New Order from ${shipping.full_name}</h2>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Address:</strong> ${shipping.street}, ${shipping.city}, ${shipping.state} - ${shipping.postal_code}</p>
        <ul>${itemsList}</ul>
        <p><strong>Total:</strong> ₹${order.total}</p>
      `,
    });

    res.status(200).json({ success: true });
  } catch (err) {
    console.error('Mail error:', err);
    res.status(500).json({ error: 'Failed to send email' });
  }
}
