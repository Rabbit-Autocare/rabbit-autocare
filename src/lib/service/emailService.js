import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  service: 'gmail', // Or your SMTP provider
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

export async function sendOrderConfirmation(to, order) {
  if (!to) return;
  await transporter.sendMail({
    from: process.env.EMAIL_USER,
    to,
    subject: 'Your Order Confirmation',
    text: `Thank you for your order!\nOrder ID: ${order.order_number}\nTotal: ₹${order.total}\nWe will process your order soon.`,
    // html: ... (optional)
  });
}

export async function sendAdminNotification(order) {
  if (!process.env.ADMIN_EMAIL) return;
  await transporter.sendMail({
    from: process.env.EMAIL_USER,
    to: process.env.ADMIN_EMAIL,
    subject: 'New Order Placed',
    text: `A new order has been placed.\nOrder ID: ${order.order_number}\nTotal: ₹${order.total}\nUser: ${order.user_info?.email || ''}`,
  });
}
