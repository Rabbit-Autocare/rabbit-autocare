import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: 'smtp.hostinger.com',
  port: 465,
  secure: true,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
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
    const imageUrl = item.main_image_url || item.image || 'https://rabbitautocare.in/placeholder.png';
    return `
      <tr>
        <td style="padding: 12px 8px; border-bottom: 1px solid #eee; vertical-align: top;">
          <img src="${imageUrl}" alt="${item.name}" style="width: 56px; height: 56px; object-fit: cover; border-radius: 8px; margin-right: 12px; display: inline-block; vertical-align: middle;" />
        </td>
        <td style="padding: 12px 8px; border-bottom: 1px solid #eee; vertical-align: top;">
          <div style="font-weight: 500; color: #222; margin-bottom: 2px;">${item.name}</div>
          <div style="font-size: 13px; color: #666;">${item.variant_name || item.size || ''}</div>
          ${variantsHtml ? `<div>${variantsHtml}</div>` : ''}
        </td>
        <td style="padding: 12px 8px; border-bottom: 1px solid #eee; text-align: center; vertical-align: top;">${item.quantity}</td>
        <td style="padding: 12px 8px; border-bottom: 1px solid #eee; text-align: right; vertical-align: top;">₹${item.price || item.unit_price || 0}</td>
      </tr>
    `;
  }).join('');
}

export async function sendOrderConfirmation(to, order) {
  if (!to) return;

  const productHtmlRows = generateProductDetailsHTML(order.items);
  const logoUrl = "https://ubnifppknfszvqkxqbfp.supabase.co/storage/v1/object/public/staticimages/assets/RabbitLogo.png"
  const shipping = order.user_info?.shipping_address || {}
  const billing = order.user_info?.billing_address || {}
  let paymentStatus = order.payment_status || "Paid"
  if (paymentStatus === "Paid") {
    paymentStatus = "Prepaid"
  }
  const orderDate = order.completed_at ? new Date(order.completed_at).toLocaleString("en-IN") : ""
  const subtotal = order.subtotal || 0
  const deliveryCharge = order.delivery_charge || 0
  const total = order.total || 0
  const discount = order.discount_amount || 0

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 680px; margin: auto; border: 1px solid #e5e7eb; border-radius: 12px; overflow: hidden; background: #fff;">
      <div style="background: #601e8d; padding: 24px 0; text-align: center;">
        <img src="${logoUrl}" alt="Rabbit Auto Care" style="height: 60px; margin-bottom: 8px;" />
        <h2 style="color: #fff; margin: 0; font-size: 28px; letter-spacing: 1px;">Order Confirmation</h2>
        <p style="color: #e0d7f7; margin: 8px 0 0 0; font-size: 16px;">Thank you for shopping with <strong>Rabbit Auto Care</strong>!</p>
      </div>
      <div style="padding: 24px; background: #f9fafb;">
        <div style="background: #ffffff; padding: 24px; border-radius: 8px;">
          <h3 style="color: #601e8d; font-size: 20px; margin-bottom: 12px;">Order Details</h3>
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 18px;">
            <thead>
              <tr style="background: #f3f4f6;">
                <th style="padding: 10px; border-bottom: 1px solid #e5e7eb; text-align: left; font-size: 15px;">Image</th>
                <th style="padding: 10px; border-bottom: 1px solid #e5e7eb; text-align: left; font-size: 15px;">Product</th>
                <th style="padding: 10px; border-bottom: 1px solid #e5e7eb; text-align: center; font-size: 15px;">Qty</th>
                <th style="padding: 10px; border-bottom: 1px solid #e5e7eb; text-align: right; font-size: 15px;">Unit Price</th>
              </tr>
            </thead>
            <tbody>
              ${productHtmlRows}
            </tbody>
          </table>
          <div style="margin: 24px 0 18px 0; border-radius: 8px; background: #f8f8fa; padding: 18px 16px;">
            <div style="display: flex; justify-content: space-between; font-size: 15px; margin-bottom: 6px;">
              <span>Subtotal</span>
              <span>₹${subtotal}</span>
            </div>
            <div style="display: flex; justify-content: space-between; font-size: 15px; margin-bottom: 6px;">
              <span>Shipping / Delivery Charges</span>
              <span style="color: ${deliveryCharge > 0 ? "#333" : "#22c55e"}; font-weight: ${deliveryCharge > 0 ? "normal" : "600"};">
                ${deliveryCharge > 0 ? `₹${deliveryCharge}` : "FREE"}
              </span>
            </div>
            ${discount > 0 ? `<div style='display: flex; justify-content: space-between; font-size: 15px; margin-bottom: 6px; color: #22c55e; font-weight: 600;'><span>Discount</span><span>-₹${discount}</span></div>` : ""}
            <div style="border-top: 1px solid #e5e7eb; margin: 10px 0 0 0; padding-top: 10px; display: flex; justify-content: space-between; font-size: 17px; font-weight: bold;">
              <span>Total</span>
              <span style="color: #601e8d;">₹${total}</span>
            </div>
          </div>
          <div style="border-top: 1px solid #e5e7eb; margin-top: 20px; padding-top: 20px;">
            <div style="font-size: 15px; color: #333; margin-bottom: 10px;">
              <p><strong>Order ID:</strong> ${order.order_number}</p>
              <p><strong>Order Date:</strong> ${orderDate}</p>
              <p><strong>Payment Status:</strong> <span style="color: #22c55e; font-weight: 600;">${paymentStatus}</span></p>
            </div>
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 20px; margin-top: 20px;">
              <div>
                <h4 style="margin: 0 0 6px 0; color: #601e8d; font-size: 16px;">Shipping Address</h4>
                <div style="font-size: 15px; color: #444; line-height: 1.6;">
                  ${shipping.name || ""}<br/>
                  ${shipping.address || ""}<br/>
                  ${shipping.city || ""}, ${shipping.state || ""} - ${shipping.postal_code || ""}<br/>
                  ${shipping.phone ? "Phone: " + shipping.phone : ""}
                </div>
              </div>
              <div>
                <h4 style="margin: 0 0 6px 0; color: #601e8d; font-size: 16px;">Billing Address</h4>
                <div style="font-size: 15px; color: #444; line-height: 1.6;">
                  ${billing.name || ""}<br/>
                  ${billing.address || ""}<br/>
                  ${billing.city || ""}, ${billing.state || ""} - ${billing.postal_code || ""}<br/>
                  ${billing.phone ? "Phone: " + billing.phone : ""}
                </div>
              </div>
            </div>
          </div>
           <hr style="margin: 24px 0; border: none; border-top: 1px solid #e5e7eb;" />
           <p style="font-size: 14px; color: #888; margin-bottom: 0; text-align: center;">
             We'll send you another update once your order is shipped.<br/>
             Questions? Reach us at <a href="mailto:support@rabbitautocare.com" style="color: #601e8d; text-decoration: underline;">support@rabbitautocare.com</a>
           </p>
        </div>
      </div>
      <footer style="background: #f8fafc; text-align: center; padding: 20px; border-top: 1px solid #e5e7eb;">
        <img src="${logoUrl}" alt="Rabbit Auto Care" style="height: 32px; margin-bottom: 12px;" />
        <p style="margin: 0 0 8px 0; font-size: 13px; color: #6b7280;">
          © ${new Date().getFullYear()} Rabbit Auto Care. All rights reserved.
        </p>
        <div style="font-size: 12px;">
          <a href="https://rabbitautocare.in/privacy-policy" style="color: #601e8d; text-decoration: none; margin: 0 8px;">Privacy Policy</a>
          <span style="color: #d1d5db;">|</span>
          <a href="https://rabbitautocare.in/terms-and-conditions" style="color: #601e8d; text-decoration: none; margin: 0 8px;">Terms of Service</a>
        </div>
      </footer>
    </div>
  `

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
    subtotal = 0,
    delivery_charge = 0,
    discount_amount = 0,
    payment_status = "Paid",
  } = order

  const userEmail = user_info?.email || "N/A"
  const userPhone = user_info?.phone || "N/A"
  const userName = user_info?.name || 'N/A';
  const shipping = user_info?.shipping_address || {}
  const billing = user_info?.billing_address || {}
  const orderDate = completed_at ? new Date(completed_at).toLocaleString("en-IN") : ""
  const logoUrl = "https://ubnifppknfszvqkxqbfp.supabase.co/storage/v1/object/public/staticimages/assets/RabbitLogo.png"
  const htmlProductList = items.map(item => {
    const imageUrl = item.main_image_url || item.image || 'https://rabbitautocare.in/placeholder.png';
    return `
      <tr>
        <td style="padding: 12px 8px; border-bottom: 1px solid #eee; vertical-align: top;">
          <img src="${imageUrl}" alt="${item.name}" style="width: 56px; height: 56px; object-fit: cover; border-radius: 8px; margin-right: 12px; display: inline-block; vertical-align: middle;" />
        </td>
        <td style="padding: 12px 8px; border-bottom: 1px solid #eee; vertical-align: top;">
          <div style="font-weight: 500; color: #222; margin-bottom: 2px;">${item.name}</div>
          <div style="font-size: 13px; color: #666;">${item.variant_name || item.size || ''}</div>
        </td>
        <td style="padding: 12px 8px; border-bottom: 1px solid #eee; text-align: center; vertical-align: top;">${item.quantity}</td>
        <td style="padding: 12px 8px; border-bottom: 1px solid #eee; text-align: right; vertical-align: top;">₹${item.price || item.unit_price || 0}</td>
      </tr>
    `;
  }).join('');

  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 680px; margin: auto; border: 1px solid #e5e7eb; border-radius: 12px; overflow: hidden; background: #fff;">
      <div style="background: #601e8d; padding: 24px 0; text-align: center;">
        <img src="${logoUrl}" alt="Rabbit Auto Care" style="height: 60px; margin-bottom: 8px;" />
        <h2 style="color: #fff; margin: 0; font-size: 28px; letter-spacing: 1px;">New Order Notification</h2>
        <p style="color: #e0d7f7; margin: 8px 0 0 0; font-size: 16px;">A new order has been placed on <strong>Rabbit Auto Care</strong>.</p>
      </div>
      <div style="padding: 24px; background: #f9fafb;">
        <div style="background: #ffffff; padding: 24px; border-radius: 8px;">
          <h3 style="color: #601e8d; font-size: 20px; margin-bottom: 12px;">Order Details</h3>
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 18px;">
            <thead>
              <tr style="background: #f3f4f6;">
                <th style="padding: 10px; border-bottom: 1px solid #e5e7eb; text-align: left; font-size: 15px;">Image</th>
                <th style="padding: 10px; border-bottom: 1px solid #e5e7eb; text-align: left; font-size: 15px;">Product</th>
                <th style="padding: 10px; border-bottom: 1px solid #e5e7eb; text-align: center; font-size: 15px;">Qty</th>
                <th style="padding: 10px; border-bottom: 1px solid #e5e7eb; text-align: right; font-size: 15px;">Unit Price</th>
              </tr>
            </thead>
            <tbody>
              ${htmlProductList}
            </tbody>
          </table>
          <div style="margin: 24px 0 18px 0; border-radius: 8px; background: #f8f8fa; padding: 18px 16px;">
            <div style="display: flex; justify-content: space-between; font-size: 15px; margin-bottom: 6px;">
              <span>Subtotal</span>
              <span>₹${subtotal}</span>
            </div>
            <div style="display: flex; justify-content: space-between; font-size: 15px; margin-bottom: 6px;">
              <span>Shipping / Delivery Charges</span>
              <span style="color: ${delivery_charge > 0 ? "#333" : "#22c55e"}; font-weight: ${delivery_charge > 0 ? "normal" : "600"};">
                ${delivery_charge > 0 ? `₹${delivery_charge}` : "FREE"}
              </span>
            </div>
            ${discount_amount > 0 ? `<div style='display: flex; justify-content: space-between; font-size: 15px; margin-bottom: 6px; color: #22c55e; font-weight: 600;'><span>Discount</span><span>-₹${discount_amount}</span></div>` : ""}
            <div style="border-top: 1px solid #e5e7eb; margin: 10px 0 0 0; padding-top: 10px; display: flex; justify-content: space-between; font-size: 17px; font-weight: bold;">
              <span>Total</span>
              <span style="color: #601e8d;">₹${total}</span>
            </div>
          </div>
          <div style="border-top: 1px solid #e5e7eb; margin-top: 20px; padding-top: 20px;">
            <div style="font-size: 15px; color: #333; margin-bottom: 10px;">
              <p><strong>Order ID:</strong> ${order_number}</p>
              <p><strong>Order Date:</strong> ${orderDate}</p>
              <p><strong>Payment Status:</strong> <span style="color: #22c55e; font-weight: 600;">${
                payment_status === "Paid" ? "Prepaid" : payment_status
              }</span></p>
            </div>
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 20px; margin-top: 20px;">
              <div>
                <h4 style="margin: 0 0 6px 0; color: #601e8d; font-size: 16px;">Shipping Address</h4>
                <div style="font-size: 15px; color: #444; line-height: 1.6;">
                  ${shipping.name || ""}<br/>
                  ${shipping.address || ""}<br/>
                  ${shipping.city || ""}, ${shipping.state || ""} - ${shipping.postal_code || ""}<br/>
                  ${shipping.phone ? "Phone: " + shipping.phone : ""}
                </div>
              </div>
              <div>
                <h4 style="margin: 0 0 6px 0; color: #601e8d; font-size: 16px;">Billing Address</h4>
                <div style="font-size: 15px; color: #444; line-height: 1.6;">
                  ${billing.name || ""}<br/>
                  ${billing.address || ""}<br/>
                  ${billing.city || ""}, ${billing.state || ""} - ${billing.postal_code || ""}<br/>
                  ${billing.phone ? "Phone: " + billing.phone : ""}
                </div>
              </div>
            </div>
            <div style="margin-top: 20px;">
              <h4 style="margin: 0 0 6px 0; color: #601e8d; font-size: 16px;">Customer Info</h4>
              <div style="font-size: 15px; color: #444; line-height: 1.6;">
                Name: ${userName}<br/>
                Email: ${userEmail}<br/>
                Phone: ${userPhone}
              </div>
            </div>
          </div>
        </div>
      </div>
      <footer style="background: #f8fafc; text-align: center; padding: 20px; border-top: 1px solid #e5e7eb;">
        <img src="${logoUrl}" alt="Rabbit Auto Care" style="height: 32px; margin-bottom: 12px;" />
        <p style="margin: 0 0 8px 0; font-size: 13px; color: #6b7280;">
          © ${new Date().getFullYear()} Rabbit Auto Care - Admin Notification
        </p>
        <div style="font-size: 12px; color: #9ca3af;">
          This is an automated notification.
        </div>
      </footer>
    </div>
  `

  await transporter.sendMail({
    from: `"Rabbit Auto Care" <${process.env.EMAIL_USER}>`,
    to: process.env.ADMIN_EMAIL,
    subject: `New Order Placed - #${order_number}`,
    html: htmlContent,
  });
}
