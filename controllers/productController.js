import { query } from '../config/db.js';

function formatProduct(p) {
  return {
    id: p.id,
    name: p.name,
    tagline: p.tagline,
    category: p.category,
    price: parseFloat(p.price),
    originalPrice: p.original_price ? parseFloat(p.original_price) : null,
    stockCount: parseInt(p.stock_count || 0, 10),
    image: p.image,
    description: p.description,
    features:
      typeof p.features === 'string'
        ? JSON.parse(p.features)
        : Array.isArray(p.features)
        ? p.features
        : [],
    colors:
      typeof p.colors === 'string'
        ? JSON.parse(p.colors)
        : Array.isArray(p.colors)
        ? p.colors
        : [],
    specs:
      typeof p.specs === 'string'
        ? JSON.parse(p.specs)
        : typeof p.specs === 'object' && p.specs !== null
        ? p.specs
        : {},
    createdAt: p.created_at,
    updatedAt: p.updated_at,
  };
}

export async function getAllProducts(req, res, next) {
  try {
    const rawProducts = await query('SELECT * FROM products ORDER BY id DESC');
    const formatted = rawProducts.map(formatProduct);
    res.json({
      success: true,
      count: formatted.length,
      products: formatted,
    });
  } catch (error) {
    next(error);
  }
}

export async function getProductById(req, res, next) {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      return res.status(400).json({ success: false, message: 'Invalid product ID' });
    }

    const rows = await query('SELECT * FROM products WHERE id = ?', [id]);
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    res.json({
      success: true,
      product: formatProduct(rows[0]),
    });
  } catch (error) {
    next(error);
  }
}

export async function createProduct(req, res, next) {
  try {
    const p = req.sanitizedProduct;

    const result = await query(
      `INSERT INTO products (name, tagline, category, price, original_price, stock_count, image, description, features, colors, specs)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        p.name,
        p.tagline,
        p.category,
        p.price,
        p.originalPrice,
        p.stockCount,
        p.image,
        p.description,
        JSON.stringify(p.features),
        JSON.stringify(p.colors || []),
        JSON.stringify(p.specs),
      ]
    );

    const newId = result.insertId;
    const created = await query('SELECT * FROM products WHERE id = ?', [newId]);

    res.status(201).json({
      success: true,
      message: 'Product created successfully',
      product: created.length > 0 ? formatProduct(created[0]) : { id: newId, ...p },
    });
  } catch (error) {
    next(error);
  }
}

export async function updateProduct(req, res, next) {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      return res.status(400).json({ success: false, message: 'Invalid product ID' });
    }

    const existing = await query('SELECT id FROM products WHERE id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    const p = req.sanitizedProduct;

    await query(
      `UPDATE products 
       SET name = ?, tagline = ?, category = ?, price = ?, original_price = ?, stock_count = ?, image = ?, description = ?, features = ?, colors = ?, specs = ?
       WHERE id = ?`,
      [
        p.name,
        p.tagline,
        p.category,
        p.price,
        p.originalPrice,
        p.stockCount,
        p.image,
        p.description,
        JSON.stringify(p.features),
        JSON.stringify(p.colors || []),
        JSON.stringify(p.specs),
        id,
      ]
    );

    const updated = await query('SELECT * FROM products WHERE id = ?', [id]);

    res.json({
      success: true,
      message: 'Product updated successfully',
      product: formatProduct(updated[0]),
    });
  } catch (error) {
    next(error);
  }
}

export async function deleteProduct(req, res, next) {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      return res.status(400).json({ success: false, message: 'Invalid product ID' });
    }

    const existing = await query('SELECT name FROM products WHERE id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    await query('DELETE FROM products WHERE id = ?', [id]);

    res.json({
      success: true,
      message: `Product "${existing[0].name}" deleted successfully.`,
    });
  } catch (error) {
    next(error);
  }
}
