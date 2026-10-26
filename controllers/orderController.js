import { query } from '../config/db.js';
import { sendOrderNotificationEmail } from '../services/emailService.js';

export async function createOrder(req, res, next) {
  try {
    const { customer, items } = req.sanitizedOrder;

    const orderId = `ORD-${Date.now().toString().slice(-6)}`;
    const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const shipping = parseFloat(req.sanitizedOrder.shipping ?? customer.deliveryFee ?? 0) || 0.0;
    const total = subtotal + shipping;

    const lat = customer.coordinates?.lat ? parseFloat(customer.coordinates.lat) : null;
    const lon = customer.coordinates?.lng
      ? parseFloat(customer.coordinates.lng)
      : customer.coordinates?.lon
      ? parseFloat(customer.coordinates.lon)
      : null;

    const wilayaStr = customer.wilaya
      ? typeof customer.wilaya === 'object'
        ? `${customer.wilaya.code} - ${customer.wilaya.name} (${customer.wilaya.nameAr || ''})`
        : String(customer.wilaya)
      : 'Non spécifiée';

    // Security: Parameterized Query
    await query(
      `INSERT INTO orders (id, customer_name, customer_email, customer_phone, delivery_location, latitude, longitude, customer_notes, subtotal, shipping, total, payment_method, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'cod', 'Processing')`,
      [
        orderId,
        customer.name,
        customer.email,
        customer.phone,
        `[Wilaya: ${wilayaStr}] ${customer.location}`,
        lat,
        lon,
        customer.notes || null,
        subtotal,
        shipping,
        total,
      ]
    );

    // Insert order items (with selected color if provided)
    for (const item of items) {
      const itemName = item.selectedColor 
        ? `${item.name} (${item.selectedColor.name})`
        : item.name;

      await query(
        `INSERT INTO order_items (order_id, product_id, product_name, price, quantity, image)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [orderId, item.id || null, itemName, item.price, item.quantity, item.image || null]
      );
    }

    const createdOrder = {
      id: orderId,
      customer: {
        ...customer,
        wilayaStr,
        deliveryFee: shipping,
      },
      items,
      subtotal,
      shipping,
      total,
      paymentMethod: 'cod',
      status: 'Processing',
      createdAt: new Date().toISOString(),
    };

    // Send email notification to admin (fetch recipient from site_settings)
    (async () => {
      try {
        const settingsRows = await query('SELECT order_notification_email, contact_email FROM site_settings WHERE id = 1 LIMIT 1');
        const adminDestEmail = settingsRows.length > 0
          ? (settingsRows[0].order_notification_email || settingsRows[0].contact_email)
          : null;
        await sendOrderNotificationEmail(createdOrder, adminDestEmail);
      } catch (err) {
        console.warn('Order notification email background error:', err.message);
      }
    })();

    res.status(201).json({
      success: true,
      message: 'Order placed successfully!',
      order: createdOrder,
    });
  } catch (error) {
    next(error);
  }
}

export async function getAllOrders(req, res, next) {
  try {
    const rawOrders = await query('SELECT * FROM orders ORDER BY created_at DESC');

    const formattedOrders = [];
    for (const ord of rawOrders) {
      const items = await query('SELECT * FROM order_items WHERE order_id = ?', [ord.id]);

      formattedOrders.push({
        id: ord.id,
        createdAt: ord.created_at,
        status: ord.status,
        customer: {
          name: ord.customer_name,
          email: ord.customer_email,
          phone: ord.customer_phone,
          location: ord.delivery_location,
          notes: ord.customer_notes,
          coordinates:
            ord.latitude && ord.longitude
              ? { lat: parseFloat(ord.latitude), lng: parseFloat(ord.longitude) }
              : null,
        },
        items: items.map((i) => ({
          id: i.product_id,
          name: i.product_name,
          price: parseFloat(i.price),
          quantity: parseInt(i.quantity, 10),
          image: i.image,
        })),
        subtotal: parseFloat(ord.subtotal),
        shipping: parseFloat(ord.shipping),
        total: parseFloat(ord.total),
        paymentMethod: 'Cash on Delivery',
      });
    }

    res.json({
      success: true,
      count: formattedOrders.length,
      orders: formattedOrders,
    });
  } catch (error) {
    next(error);
  }
}

export async function updateOrderStatus(req, res, next) {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ['Processing', 'Confirmed', 'Shipped', 'Delivered', 'Cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status. Must be one of: ${validStatuses.join(', ')}`,
      });
    }

    const existing = await query('SELECT id FROM orders WHERE id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    await query('UPDATE orders SET status = ? WHERE id = ?', [status, id]);

    res.json({
      success: true,
      message: `Order #${id} status updated to ${status}.`,
    });
  } catch (error) {
    next(error);
  }
}

export async function deleteOrder(req, res, next) {
  try {
    const { id } = req.params;
    const existing = await query('SELECT id FROM orders WHERE id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    await query('DELETE FROM orders WHERE id = ?', [id]);

    res.json({
      success: true,
      message: `Order #${id} deleted successfully.`,
    });
  } catch (error) {
    next(error);
  }
}
