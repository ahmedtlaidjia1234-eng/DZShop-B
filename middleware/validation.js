import validator from 'validator';
import { sanitizeString } from './security.js';

export function validateLogin(req, res, next) {
  const { username, password } = req.body;

  if (!username || typeof username !== 'string' || !password || typeof password !== 'string') {
    return res.status(400).json({
      success: false,
      message: 'Both username/email and password are required.',
    });
  }

  req.body.username = sanitizeString(username);
  next();
}

export function validateCheckoutOrder(req, res, next) {
  const { customer, items } = req.body;

  if (!customer || typeof customer !== 'object') {
    return res.status(400).json({
      success: false,
      message: 'Customer information is required.',
    });
  }

  const name = sanitizeString(customer.name || '');
  const email = sanitizeString(customer.email || '');
  const phone = sanitizeString(customer.phone || '');
  const location = sanitizeString(customer.location || '');
  const notes = sanitizeString(customer.notes || '');
  const wilaya = customer.wilaya || null;
  const rawShipping = customer.deliveryFee ?? req.body.shipping ?? req.body.deliveryFee ?? 0;
  const deliveryFee = parseFloat(rawShipping) || 0;

  if (!name || name.length < 2) {
    return res.status(400).json({
      success: false,
      message: 'Full customer name is required (minimum 2 characters).',
    });
  }

  if (email && !validator.isEmail(email)) {
    return res.status(400).json({
      success: false,
      message: 'Please enter a valid email address.',
    });
  }

  if (!phone || phone.replace(/[^0-9+]/g, '').length < 6) {
    return res.status(400).json({
      success: false,
      message: 'A valid phone number is required (minimum 6 digits).',
    });
  }

  if (!location || location.length < 2) {
    return res.status(400).json({
      success: false,
      message: 'Delivery address is required.',
    });
  }

  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({
      success: false,
      message: 'Your cart is empty. At least one item is required.',
    });
  }

  for (const item of items) {
    if (!item.name || typeof item.price !== 'number' || typeof item.quantity !== 'number') {
      return res.status(400).json({
        success: false,
        message: 'Invalid item structure in order items.',
      });
    }
    if (item.quantity <= 0 || item.price < 0) {
      return res.status(400).json({
        success: false,
        message: 'Item quantities and prices must be positive numbers.',
      });
    }
  }

  req.sanitizedOrder = {
    customer: {
      name,
      email: email || 'client@auracommerce.com',
      phone,
      location,
      notes,
      wilaya,
      deliveryFee,
      coordinates: customer.coordinates || null,
    },
    shipping: deliveryFee,
    items: items.map((i) => ({
      id: i.id,
      name: sanitizeString(i.name),
      price: i.price,
      quantity: i.quantity,
      image: i.image || '',
      selectedColor: i.selectedColor || null,
    })),
    paymentMethod: 'cod', // Only Cash on Delivery
  };

  next();
}

export function validateProduct(req, res, next) {
  const {
    name,
    category,
    price,
    originalPrice,
    stockCount,
    image,
    description,
    features,
    colors,
    specs,
    tagline,
  } = req.body;

  if (!name || typeof name !== 'string' || name.trim().length === 0) {
    return res.status(400).json({
      success: false,
      message: 'Product name is required.',
    });
  }

  const parsedPrice = parseFloat(price);
  if (isNaN(parsedPrice) || parsedPrice < 0) {
    return res.status(400).json({
      success: false,
      message: 'Valid positive product price is required.',
    });
  }

  const parsedStock = parseInt(stockCount, 10);
  if (isNaN(parsedStock) || parsedStock < 0) {
    return res.status(400).json({
      success: false,
      message: 'Stock count must be a non-negative integer.',
    });
  }

  // Sanitize colors if provided
  let sanitizedColors = [];
  if (Array.isArray(colors)) {
    sanitizedColors = colors.map((col) => ({
      name: sanitizeString(col.name || 'Color'),
      hex: sanitizeString(col.hex || col.code || '#000000'),
      code: sanitizeString(col.code || col.hex || '#000000'),
      image: col.image ? sanitizeString(col.image) : '',
    }));
  }

  req.sanitizedProduct = {
    name: sanitizeString(name),
    tagline: sanitizeString(tagline || ''),
    category: sanitizeString(category || 'General'),
    price: parsedPrice,
    originalPrice: originalPrice ? parseFloat(originalPrice) : null,
    stockCount: parsedStock,
    image: image ? sanitizeString(image) : '',
    description: sanitizeString(description || ''),
    features: Array.isArray(features) ? features.map(sanitizeString) : [],
    colors: sanitizedColors,
    specs: typeof specs === 'object' && specs !== null ? specs : {},
  };

  next();
}

export function validateSettings(req, res, next) {
  const {
    siteName,
    siteSubtitle,
    siteTagline,
    announcement,
    showAnnouncement,
    contactEmail,
    orderNotificationEmail,
    currency,
    categories,
    seoMetaTitle,
    seoMetaDescription,
    seoKeywords,
    offerEnabled,
    offerTitle,
    offerSubtitle,
    offerDiscount,
    offerProductId,
    offerBadge,
    offerImage,
  } = req.body;

  if (!siteName || typeof siteName !== 'string' || siteName.trim().length === 0) {
    return res.status(400).json({
      success: false,
      message: 'Website name is required.',
    });
  }

  if (contactEmail && !validator.isEmail(contactEmail)) {
    return res.status(400).json({
      success: false,
      message: 'Please provide a valid contact email format.',
    });
  }

  req.sanitizedSettings = {
    siteName: sanitizeString(siteName),
    siteSubtitle: sanitizeString(siteSubtitle || ''),
    siteTagline: sanitizeString(siteTagline || ''),
    announcement: sanitizeString(announcement || ''),
    showAnnouncement: Boolean(showAnnouncement),
    contactEmail: sanitizeString(contactEmail || 'contact@auracommerce.com'),
    orderNotificationEmail: sanitizeString(orderNotificationEmail || contactEmail || 'admin@auracommerce.com'),
    currency: sanitizeString(currency || 'DZD'),
    categories: Array.isArray(categories) ? categories.map(sanitizeString) : [],
    seoMetaTitle: sanitizeString(seoMetaTitle || ''),
    seoMetaDescription: sanitizeString(seoMetaDescription || ''),
    seoKeywords: sanitizeString(seoKeywords || ''),
    offerEnabled: Boolean(offerEnabled),
    offerTitle: sanitizeString(offerTitle || ''),
    offerSubtitle: sanitizeString(offerSubtitle || ''),
    offerDiscount: sanitizeString(offerDiscount || ''),
    offerProductId: offerProductId ? parseInt(offerProductId, 10) : null,
    offerBadge: sanitizeString(offerBadge || ''),
    offerImage: offerImage ? sanitizeString(offerImage) : '',
  };

  next();
}
