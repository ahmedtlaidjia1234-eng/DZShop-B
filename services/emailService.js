import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

let transporter = null;

function getTransporter() {
  if (transporter) return transporter;

  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (user && pass) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT || '587', 10),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user,
        pass,
      },
    });
  }
  return transporter;
}

export async function sendOrderNotificationEmail(order, destinationEmail) {
  const recipient = destinationEmail || process.env.ADMIN_EMAIL || 'admin@auracommerce.com';
  const customer = order.customer || {};
  const items = order.items || [];

  const itemsHtml = items
    .map(
      (item) => `
      <tr>
        <td style="padding: 10px; border-bottom: 1px solid #e2e8f0;">
          <strong>${item.name}</strong>
          ${
            item.selectedColor
              ? `<br><span style="color: #6366f1; font-size: 12px;">Couleur: ${item.selectedColor.name}</span>`
              : ''
          }
        </td>
        <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; text-align: center;">${item.quantity}</td>
        <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; text-align: right;">${Number(item.price).toLocaleString()} DZD</td>
        <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; text-align: right;"><strong>${Number(item.price * item.quantity).toLocaleString()} DZD</strong></td>
      </tr>
    `
    )
    .join('');

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8" /></head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 20px;">
      <div style="max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
        
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); padding: 24px; text-align: center; color: #ffffff;">
          <h1 style="margin: 0; font-size: 22px; font-weight: 800;">🔔 Nouvelle Commande #${order.id}</h1>
          <p style="margin: 6px 0 0 0; color: #94a3b8; font-size: 13px;">Paiement en espèces à la livraison (Cash on Delivery)</p>
        </div>

        <div style="padding: 24px;">
          <!-- Customer Details -->
          <div style="background: #f1f5f9; border-radius: 8px; padding: 16px; margin-bottom: 20px;">
            <h3 style="margin: 0 0 10px 0; font-size: 15px; color: #0f172a;">👤 Informations Client</h3>
            <p style="margin: 4px 0; font-size: 14px;"><strong>Nom :</strong> ${customer.name || 'Non spécifié'}</p>
            <p style="margin: 4px 0; font-size: 14px;"><strong>Téléphone :</strong> <a href="tel:${customer.phone}" style="color: #4f46e5; text-decoration: none; font-weight: 700;">${customer.phone || 'Non spécifié'}</a></p>
            <p style="margin: 4px 0; font-size: 14px;"><strong>Email :</strong> ${customer.email || 'Non spécifié'}</p>
            <p style="margin: 4px 0; font-size: 14px;"><strong>Wilaya :</strong> <span style="background: #dbeafe; color: #1e40af; padding: 2px 8px; border-radius: 4px; font-weight: 700;">${customer.wilaya || customer.wilayaStr || 'Non spécifiée'}</span></p>
            <p style="margin: 4px 0; font-size: 14px;"><strong>Adresse :</strong> ${customer.location || 'Non spécifiée'}</p>
            ${customer.notes ? `<p style="margin: 8px 0 0 0; font-size: 13px; color: #64748b; background: #fff; padding: 8px; border-radius: 6px;"><em>Note : "${customer.notes}"</em></p>` : ''}
          </div>

          <!-- Items Ordered Table -->
          <h3 style="margin: 0 0 12px 0; font-size: 15px; color: #0f172a;">📦 Articles Commandés</h3>
          <table style="width: 100%; border-collapse: collapse; font-size: 14px; margin-bottom: 20px;">
            <thead>
              <tr style="background: #f8fafc; color: #64748b; text-align: left;">
                <th style="padding: 8px 10px; border-bottom: 2px solid #e2e8f0;">Produit</th>
                <th style="padding: 8px 10px; border-bottom: 2px solid #e2e8f0; text-align: center;">Qté</th>
                <th style="padding: 8px 10px; border-bottom: 2px solid #e2e8f0; text-align: right;">Prix</th>
                <th style="padding: 8px 10px; border-bottom: 2px solid #e2e8f0; text-align: right;">Total</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHtml}
            </tbody>
          </table>

          <!-- Financial Breakdown -->
          <div style="border-top: 2px solid #e2e8f0; padding-top: 14px; margin-bottom: 20px;">
            <div style="display: flex; justify-content: space-between; margin-bottom: 6px; font-size: 14px; color: #64748b;">
              <span>Sous-total articles :</span>
              <span>${Number(order.subtotal || 0).toLocaleString()} DZD</span>
            </div>
            <div style="display: flex; justify-content: space-between; margin-bottom: 6px; font-size: 14px; color: #64748b;">
              <span>Frais de livraison (${customer.wilaya || 'Wilaya'}) :</span>
              <span>${Number(order.shipping || 0).toLocaleString()} DZD</span>
            </div>
            <div style="display: flex; justify-content: space-between; font-size: 18px; font-weight: 800; color: #0f172a; padding-top: 8px; border-top: 1px dashed #cbd5e1;">
              <span>Total Commande :</span>
              <span style="color: #16a34a;">${Number(order.total || 0).toLocaleString()} DZD</span>
            </div>
          </div>

          <!-- Footer Badge -->
          <div style="text-align: center; background: #ecfdf5; border: 1px solid #86efac; border-radius: 8px; padding: 12px; color: #166534; font-size: 13px;">
            <strong>💵 Mode : Paiement en espèces à la livraison (COD)</strong>
            <br />Veuillez préparer le colis et contacter le client pour confirmation.
          </div>
        </div>

        <div style="background: #f8fafc; padding: 16px; text-align: center; font-size: 12px; color: #94a3b8; border-top: 1px solid #e2e8f0;">
          AURA E-Commerce Notification Système · Algérie 58 Wilayas
        </div>
      </div>
    </body>
    </html>
  `;

  const mailOptions = {
    from: process.env.SMTP_FROM || `"AURA Commandes" <no-reply@auracommerce.com>`,
    to: recipient,
    subject: `🛒 Nouvelle Commande #${order.id} — ${customer.name || 'Client'} (${Number(order.total || 0).toLocaleString()} DZD)`,
    html: htmlContent,
  };

  const mailer = getTransporter();

  if (mailer) {
    try {
      const info = await mailer.sendMail(mailOptions);
      console.log(`📧 Email notification successfully sent to ${recipient} (Message ID: ${info.messageId})`);
      return { sent: true, recipient, messageId: info.messageId };
    } catch (err) {
      console.warn(`⚠️  Failed to send email via SMTP to ${recipient}: ${err.message}`);
      return { sent: false, error: err.message };
    }
  } else {
    console.log(`\n=============================================================`);
    console.log(`📧 [ORDER EMAIL NOTIFICATION - SIMULATION]`);
    console.log(`To: ${recipient}`);
    console.log(`Subject: ${mailOptions.subject}`);
    console.log(`Order Total: ${Number(order.total || 0).toLocaleString()} DZD (Subtotal: ${order.subtotal} DZD + Shipping: ${order.shipping} DZD)`);
    console.log(`Client: ${customer.name} | Phone: ${customer.phone} | Wilaya: ${customer.wilaya}`);
    console.log(`(Configure SMTP_USER & SMTP_PASS in server/.env to send real emails via Gmail/Sendgrid)`);
    console.log(`=============================================================\n`);
    return { sent: true, simulated: true, recipient };
  }
}
