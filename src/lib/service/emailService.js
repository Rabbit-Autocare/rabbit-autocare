import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: 'smtp.hostinger.com',
  port: 465,
  secure: true, // true for port 465
  auth: {
    user: process.env.EMAIL_USER, // set to support@rabbitautocare.com
    pass: process.env.EMAIL_PASS, // set to Rabbit@support123
  },
});

function generateProductDetailsHTML(items) {
  return items.map(item => {
    const isCombo = item.type === 'combo' || item.type === 'kit';
    const variantsHtml = isCombo && Array.isArray(item.products)
      ? `<ul style="padding-left: 16px; margin-top: 4px; font-size: 14px;">
          ${item.products.map(p =>
            `<li>${p.name} (${p.variant_name || p.size || 'Variant'}) – SKU: ${p.sku}</li>`
          ).join('')}
        </ul>`
      : '';

    return `
      <tr>
        <td style="padding: 8px; border: 1px solid #eee;">${item.name}</td>
        <td style="padding: 8px; border: 1px solid #eee; text-align: center;">${item.quantity}</td>
      </tr>
      ${variantsHtml ? `<tr><td colspan="2">${variantsHtml}</td></tr>` : ''}
    `;
  }).join('');
}

export async function sendOrderConfirmation(to, order) {
  if (!to) return;

  const productHtmlRows = generateProductDetailsHTML(order.items);

  const logoUrl = 'https://your-public-logo-url.com/logo.png'; // Replace with your uploaded logo URL

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #ddd; padding: 20px;">
      <div style="text-align: center; margin-bottom: 20px;">
        <img src="${logoUrl}" alt="Rabbit Auto Care" style="height: 60px;" />
        <h2 style="color: #444;">Order Confirmation</h2>
        <p style="color: #666;">Thanks for shopping with <strong>Rabbit Auto Care</strong>!</p>
      </div>

      <table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
        <thead>
          <tr style="background-color: #f8f8f8;">
            <th style="padding: 8px; border: 1px solid #eee; text-align: left;">Product</th>
            <th style="padding: 8px; border: 1px solid #eee; text-align: center;">Qty</th>
          </tr>
        </thead>
        <tbody>
          ${productHtmlRows}
        </tbody>
      </table>

      <div style="margin-top: 20px; font-size: 15px;">
        <p><strong>Order ID:</strong> ${order.order_number}</p>
        <p><strong>Total:</strong> ₹${order.total}</p>
      </div>

      <hr style="margin: 30px 0;" />

      <p style="font-size: 14px; color: #888;">
        We'll send you another update once your order is shipped.
        <br/>Questions? Reach us at <a href="mailto:support@rabbitautocare.in">support@rabbitautocare.in</a>
      </p>

      <footer style="text-align: center; font-size: 12px; color: #aaa; margin-top: 20px;">
        © ${new Date().getFullYear()} Rabbit Auto Care. All rights reserved.
        <br/><a href="https://rabbitautocare.in/policies" style="color: #aaa;">Policies</a>
      </footer>
    </div>
  `;

  await transporter.sendMail({
    from: `"Rabbit Auto Care" <${process.env.EMAIL_USER}>`,
    to,
    subject: `Your Order Confirmation - #${order.order_number}`,
    html,
  });
}

export async function sendAdminNotification(order) {
  if (!process.env.ADMIN_EMAIL) return;

  const {
    order_number,
    total,
    user_info = {},
    items = [],
    completed_at,
  } = order;

  const userEmail = user_info?.email || 'N/A';
  const userPhone = user_info?.phone || 'N/A';
  const userName = user_info?.name || 'N/A';

  const plainProductList = items.map((item, index) => {
    return `${index + 1}. ${item.name} (${item.quantity}x) - ₹${item.total_price}`;
  }).join('\n');

  const htmlProductList = items.map((item) => {
    return `
      <li style="margin-bottom: 12px;">
        <strong style="color: #333;">${item.name}</strong> <span style="color: #555;">(${item.quantity}x) – ₹${item.total_price}</span>
        ${item.type === 'combo' || item.type === 'kit' ? `
          <ul style="margin: 8px 0 0 16px; padding: 0; list-style-type: circle; color: #777;">
            ${(item.products || []).map(p =>
              `<li style="margin-bottom: 4px;">${p.name} – ${p.variant_name || 'Variant'} (Qty: ${p.quantity || 1})</li>`
            ).join('')}
          </ul>
        ` : ''}
      </li>
    `;
  }).join('');

  const plainText = `
🛒 A new order has been placed on Rabbit Auto Care.

📦 Order Number: ${order_number}
💰 Total Amount: ₹${total}
👤 Customer: ${userName}
📧 Email: ${userEmail}
📞 Phone: ${userPhone}
📅 Placed On: ${new Date(completed_at).toLocaleString('en-IN')}

🧾 Products:
${plainProductList}

Please check the dashboard for full details.
`.trim();

  const htmlContent = `
  <div style="font-family: 'Segoe UI', sans-serif; max-width: 600px; margin: auto; padding: 24px; background: #fdfdfd; color: #333;">
    <h2 style="color: #d93a00; margin-bottom: 8px;">🐇 New Order Notification</h2>
    <p style="font-size: 15px;">An order has just been placed on <strong>Rabbit Auto Care</strong>. Please find the details below:</p>

    <table style="width: 100%; margin-top: 16px; font-size: 15px;">
      <tr><td><strong>Order Number:</strong></td><td>${order_number}</td></tr>
      <tr><td><strong>Total Amount:</strong></td><td>₹${total}</td></tr>
      <tr><td><strong>Customer Name:</strong></td><td>${userName}</td></tr>
      <tr><td><strong>Email:</strong></td><td>${userEmail}</td></tr>
      <tr><td><strong>Phone:</strong></td><td>${userPhone}</td></tr>
      <tr><td><strong>Placed On:</strong></td><td>${new Date(completed_at).toLocaleString('en-IN')}</td></tr>
    </table>

    <h3 style="margin-top: 28px; color: #444;">🧾 Ordered Items:</h3>
    <ol style="padding-left: 20px; margin-bottom: 24px;">${htmlProductList}</ol>

    <hr style="border: none; border-top: 1px solid #ddd; margin: 24px 0;" />
    <p style="font-size: 13px; color: #888;">You can view the complete order and initiate shipping from your admin dashboard.</p>
    <p style="font-size: 12px; text-align: center; margin-top: 20px; color: #aaa;">Rabbit Auto Care • This is an automated email.</p>
  </div>
  `;

  await transporter.sendMail({
    from: `"Rabbit Auto Care" <${process.env.EMAIL_USER}>`,
    to: process.env.ADMIN_EMAIL,
    subject: `New Order Placed - #${order_number}`,
    text: plainText,
    html: htmlContent,
  });
}
