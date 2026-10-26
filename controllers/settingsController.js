import { query, isUsingMySQL } from '../config/db.js';

export async function getSettings(req, res, next) {
  try {
    const rows = await query('SELECT * FROM site_settings WHERE id = 1 LIMIT 1');
    const s = rows.length > 0 ? rows[0] : {};

    let categories = ['Audio', 'Wearables', 'Tech & Office', 'Accessories', 'Vêtements', 'Lifestyle'];
    if (s.categories) {
      try {
        categories = typeof s.categories === 'string' ? JSON.parse(s.categories) : s.categories;
      } catch {}
    }

    res.json({
      success: true,
      settings: {
        siteName: s.site_name || 'AURA',
        siteSubtitle: s.site_subtitle || 'COMMERCE',
        siteTagline: s.site_tagline || 'Boutique en ligne en Algérie - Livraison 58 Wilayas',
        announcement: s.announcement || '🚚 Livraison rapide vers les 58 Wilayas d\'Algérie ! Paiement à la livraison.',
        showAnnouncement: Boolean(s.show_announcement ?? true),
        contactEmail: s.contact_email || 'contact@auracommerce.com',
        orderNotificationEmail: s.order_notification_email || s.contact_email || 'admin@auracommerce.com',
        currency: s.currency || 'DZD',
        categories,
        seoMetaTitle: s.seo_meta_title || 'AURA Commerce | Vente en ligne en Algérie - DZD',
        seoMetaDescription: s.seo_meta_description || 'Achetez vos produits préférés en ligne en Algérie avec paiement à la livraison à domicile sur 58 wilayas.',
        seoKeywords: s.seo_keywords || 'achat en ligne, e-commerce algérie, livraison 58 wilayas, dzd, dinar algerien, paiement à la livraison',
        offerEnabled: Boolean(s.offer_enabled ?? true),
        offerTitle: s.offer_title || 'Offre Spéciale : Casque Sans Fil Aura Pro',
        offerSubtitle: s.offer_subtitle || 'Profitez d\'une réduction immédiate de 20% valable cette semaine !',
        offerDiscount: s.offer_discount || '-20%',
        offerProductId: s.offer_product_id ? parseInt(s.offer_product_id, 10) : 1,
        offerBadge: s.offer_badge || 'OFFRE DU MOMENT',
        offerImage: s.offer_image || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&auto=format&fit=crop&q=80',
        updatedAt: s.updated_at,
      },
      system: {
        databaseEngine: isUsingMySQL() ? 'MySQL 8.0' : 'Resilient Memory Engine',
        status: 'Online & Protected',
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function updateSettings(req, res, next) {
  try {
    const s = req.sanitizedSettings;

    await query(
      `UPDATE site_settings 
       SET site_name = ?, site_subtitle = ?, site_tagline = ?, announcement = ?, show_announcement = ?, contact_email = ?, order_notification_email = ?, currency = ?, categories = ?, seo_meta_title = ?, seo_meta_description = ?, seo_keywords = ?, offer_enabled = ?, offer_title = ?, offer_subtitle = ?, offer_discount = ?, offer_product_id = ?, offer_badge = ?, offer_image = ?
       WHERE id = 1`,
      [
        s.siteName,
        s.siteSubtitle,
        s.siteTagline,
        s.announcement,
        s.showAnnouncement ? 1 : 0,
        s.contactEmail,
        s.orderNotificationEmail || s.contactEmail || 'admin@auracommerce.com',
        s.currency || 'DZD',
        JSON.stringify(s.categories || []),
        s.seoMetaTitle,
        s.seoMetaDescription,
        s.seoKeywords,
        s.offerEnabled ? 1 : 0,
        s.offerTitle,
        s.offerSubtitle,
        s.offerDiscount,
        s.offerProductId,
        s.offerBadge,
        s.offerImage,
      ]
    );

    res.json({
      success: true,
      message: 'Website settings updated successfully!',
      settings: s,
    });
  } catch (error) {
    next(error);
  }
}
