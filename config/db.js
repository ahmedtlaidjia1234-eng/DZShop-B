import mysql from 'mysql2/promise';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let pool = null;
let isConnectedToMySQL = false;

// Fallback in-memory storage if MySQL server credentials are not yet configured
const fallbackState = {
  users: [],
  site_settings: {
    id: 1,
    site_name: 'AURA',
    site_subtitle: 'COMMERCE',
    site_tagline: 'Boutique en ligne en Algérie - Livraison 58 Wilayas',
    announcement: '🚚 Livraison rapide vers les 58 Wilayas d\'Algérie ! Paiement à la livraison.',
    show_announcement: true,
    contact_email: 'contact@auracommerce.com',
    order_notification_email: 'admin@auracommerce.com',
    currency: 'DZD',
    categories: ['Audio', 'Wearables', 'Tech & Office', 'Accessories', 'Vêtements', 'Lifestyle'],
    seo_meta_title: 'AURA Commerce | Vente en ligne en Algérie - DZD',
    seo_meta_description: 'Achetez vos produits préférés en ligne en Algérie avec paiement à la livraison à domicile sur 58 wilayas.',
    seo_keywords: 'achat en ligne, e-commerce algérie, livraison 58 wilayas, dzd, dinar algerien, paiement à la livraison',
    offer_enabled: true,
    offer_title: 'Offre Spéciale : Casque Sans Fil Aura Pro',
    offer_subtitle: 'Profitez d\'une réduction immédiate de 20% valable cette semaine !',
    offer_discount: '-20%',
    offer_product_id: 1,
    offer_badge: 'OFFRE DU MOMENT',
    offer_image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&auto=format&fit=crop&q=80',
  },
  products: [],
  orders: [],
  order_items: [],
};

const DEFAULT_SAMPLE_PRODUCTS = [
  {
    name: 'Aura Sound Pro Wireless Headphones',
    tagline: 'Acoustique haute fidélité avec réduction active du bruit',
    price: 18900.0,
    original_price: 24500.0,
    category: 'Audio',
    stock_count: 18,
    image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&auto=format&fit=crop&q=80',
    description: 'Immergez-vous dans un son riche et précis. Le casque Aura Sound Pro offre des basses profondes et des aigus cristallins avec jusqu\'à 40 heures d\'autonomie continue.',
    features: JSON.stringify([
      'Réduction active de bruit hybride (ANC)',
      'Autonomie de 40 heures avec charge rapide USB-C',
      'Connexion Bluetooth 5.3 multipoint',
      'Coussinets à mémoire de forme pour un confort durable',
    ]),
    colors: JSON.stringify([
      {
        name: 'Noir Minuit / Black',
        code: '#18181b',
        image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&auto=format&fit=crop&q=80',
      },
      {
        name: 'Argent Stellaire / Silver',
        code: '#e4e4e7',
        image: 'https://images.unsplash.com/photo-1546435770-a3e426bf472b?w=800&auto=format&fit=crop&q=80',
      },
      {
        name: 'Bleu Profond / Navy',
        code: '#1e3a8a',
        image: 'https://images.unsplash.com/photo-1484704849700-f032a568e944?w=800&auto=format&fit=crop&q=80',
      },
    ]),
    specs: JSON.stringify({
      Autonomie: '40 Heures',
      Connectivité: 'Bluetooth 5.3 / Jack 3.5mm',
      Garantie: '12 Mois',
    }),
  },
  {
    name: 'Montre Connectée Minimalist Chrono',
    tagline: 'Élégance moderne avec suivi de santé complet et écran AMOLED',
    price: 14500.0,
    original_price: 18900.0,
    category: 'Wearables',
    stock_count: 24,
    image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&auto=format&fit=crop&q=80',
    description: 'Conçue pour le quotidien, la montre Chrono combine écran AMOLED Always-On, suivi de la fréquence cardiaque, SpO2, étanchéité 5ATM et 14 jours d\'autonomie.',
    features: JSON.stringify([
      'Écran AMOLED 1.43" haute définition Always-On',
      'Suivi cardiofréquencemètre et sommeil en temps réel',
      'Résistance à l\'eau 5ATM (50 mètres)',
      'Compatible Android et iPhone',
    ]),
    colors: JSON.stringify([
      {
        name: 'Noir Sidéral / Black',
        code: '#09090b',
        image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&auto=format&fit=crop&q=80',
      },
      {
        name: 'Argent Métallique / Silver',
        code: '#d1d5db',
        image: 'https://images.unsplash.com/photo-1508685096489-7aacd43bd3b1?w=800&auto=format&fit=crop&q=80',
      },
    ]),
    specs: JSON.stringify({
      Écran: '1.43" AMOLED',
      Batterie: 'Jusqu\'à 14 jours',
      Étanchéité: '5ATM',
    }),
  },
  {
    name: 'Clavier Mécanique Rétro Lumix',
    tagline: 'Frappe tactile satisfaisante avec touches interchangeables',
    price: 11900.0,
    original_price: 14900.0,
    category: 'Tech & Office',
    stock_count: 12,
    image: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=800&auto=format&fit=crop&q=80',
    description: 'Format compact 75%, switches mécaniques prélubrifiés, rétroéclairage RGB personnalisé et triple connectivité sans fil.',
    features: JSON.stringify([
      'Switches mécaniques tactiles remplaçables à chaud',
      'Triple mode : Sans fil 2.4GHz, Bluetooth 5.0, Câble USB-C',
      'Rétroéclairage RGB touche par touche',
    ]),
    colors: JSON.stringify([
      {
        name: 'Gris Rétro / Retro Gray',
        code: '#71717a',
        image: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=800&auto=format&fit=crop&q=80',
      },
      {
        name: 'Blanc Neige / Pure White',
        code: '#f4f4f5',
        image: 'https://images.unsplash.com/photo-1618384887929-16ec33fab9ef?w=800&auto=format&fit=crop&q=80',
      },
    ]),
    specs: JSON.stringify({
      Disposition: '75% Compact (84 touches)',
      Batterie: '4000 mAh rechargeable',
    }),
  },
  {
    name: 'Housse Ordinateur Cuir Nomad',
    tagline: 'Protection artisanale pour ordinateurs portables 13-14 pouces',
    price: 6500.0,
    original_price: 8500.0,
    category: 'Accessories',
    stock_count: 35,
    image: 'https://images.unsplash.com/photo-1544816155-12df9643f363?w=800&auto=format&fit=crop&q=80',
    description: 'Confectionnée en cuir de qualité supérieure avec doublure intérieure en microfibre douce anti-rayures et fermeture magnétique sécurisée.',
    features: JSON.stringify([
      'Cuir véritable pleine fleur',
      'Doublure intérieure en micro-suède douce',
      'Fermeture magnétique invisible',
    ]),
    colors: JSON.stringify([
      {
        name: 'Marron Cuir / Tan Brown',
        code: '#78350f',
        image: 'https://images.unsplash.com/photo-1544816155-12df9643f363?w=800&auto=format&fit=crop&q=80',
      },
      {
        name: 'Noir Classique / Classic Black',
        code: '#1c1917',
        image: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=800&auto=format&fit=crop&q=80',
      },
    ]),
    specs: JSON.stringify({
      Compatibilité: '13" - 14" Laptops',
      Matière: 'Cuir véritable',
    }),
  },
  {
    name: 'Écouteurs Sans Fil Zenith TWS',
    tagline: 'Son dynamique avec boîtier compact et charge sans fil Qi',
    price: 8500.0,
    original_price: 11000.0,
    category: 'Audio',
    stock_count: 40,
    image: 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=800&auto=format&fit=crop&q=80',
    description: 'Haut-parleurs 11mm en titane, réduction des bruits ambiants lors des appels et jusqu\'à 32 heures d\'écoute totale.',
    features: JSON.stringify([
      'Drivers titane 11mm dynamiques',
      'Résistance IPX5 contre la sueur et les éclaboussures',
      '32 heures d\'autonomie totale avec étui',
    ]),
    colors: JSON.stringify([
      {
        name: 'Blanc Brillant / Glossy White',
        code: '#f8fafc',
        image: 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=800&auto=format&fit=crop&q=80',
      },
      {
        name: 'Noir Carbone / Carbon Black',
        code: '#0f172a',
        image: 'https://images.unsplash.com/photo-1606220588913-b3aacb4d2f46?w=800&auto=format&fit=crop&q=80',
      },
    ]),
    specs: JSON.stringify({
      Autonomie: '32h au total',
      Étanchéité: 'IPX5',
    }),
  },
  {
    name: 'Souris Ergonomique Sans Fil Apex',
    tagline: 'Posture naturelle pour un confort de travail optimal toute la journée',
    price: 7900.0,
    original_price: 9900.0,
    category: 'Tech & Office',
    stock_count: 15,
    image: 'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=800&auto=format&fit=crop&q=80',
    description: 'Angle vertical naturel de 57 degrés pour réduire la fatigue musculaire du poignet, capteur optique précis 4000 DPI et clics silencieux.',
    features: JSON.stringify([
      'Angle ergonomique scientifique de 57°',
      'Double connexion : Bluetooth et récepteur USB 2.4GHz',
      'Capteur optique haute précision réglable 4000 DPI',
    ]),
    colors: JSON.stringify([
      {
        name: 'Gris Graphite / Graphite',
        code: '#334155',
        image: 'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=800&auto=format&fit=crop&q=80',
      },
      {
        name: 'Blanc Arctique / Arctic White',
        code: '#e2e8f0',
        image: 'https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?w=800&auto=format&fit=crop&q=80',
      },
    ]),
    specs: JSON.stringify({
      DPI: '400 - 4000 DPI',
      Batterie: 'Rechargeable Li-Po',
    }),
  },
];

// Initialize Fallback State
function initFallbackState() {
  const adminPassword = process.env.ADMIN_PASSWORD || 'AdminSecurePass2026!';
  const salt = bcrypt.genSaltSync(12);
  const passwordHash = bcrypt.hashSync(adminPassword, salt);

  fallbackState.users = [ 
    {
      id: 1,
      username: process.env.ADMIN_USERNAME || 'admin',
      email: process.env.ADMIN_EMAIL || 'admin@auracommerce.com',
      password_hash: passwordHash,
      role: 'admin',
      created_at: new Date().toISOString(),
    },
  ];

  fallbackState.products = DEFAULT_SAMPLE_PRODUCTS.map((prod, index) => ({
    id: index + 1,
    name: prod.name,
    tagline: prod.tagline,
    category: prod.category,
    price: prod.price,
    original_price: prod.original_price,
    stock_count: prod.stock_count,
    image: prod.image,
    description: prod.description,
    features: JSON.parse(prod.features),
    colors: JSON.parse(prod.colors),
    specs: JSON.parse(prod.specs),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }));
}

initFallbackState();

export async function initDatabase() {
  const host = process.env.DB_HOST || 'localhost';
  const port = parseInt(process.env.DB_PORT || '3306', 10);
  const user = process.env.DB_USER || 'root';
  const password = process.env.DB_PASSWORD || '';
  const database = process.env.DB_NAME || 'aura_ecommerce';

  console.log(`🔌 Attempting connection to MySQL server at ${host}:${port}...`);

  try {
    const rootConnection = await mysql.createConnection({
      host,
      port,
      user,
      password,
      connectTimeout: 4000,
    });

    await rootConnection.query(
      `CREATE DATABASE IF NOT EXISTS \`${database}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`
    );
    await rootConnection.end();

    pool = mysql.createPool({
      host,
      port,
      user,
      password,
      database,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
      enableKeepAlive: true,
      keepAliveInitialDelay: 0,
    });

    // 1. Create tables if they do not exist directly in code
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(255) NOT NULL UNIQUE,
        email VARCHAR(255) NOT NULL UNIQUE,
        password_hash VARCHAR(255) NOT NULL,
        role VARCHAR(50) DEFAULT 'user',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS site_settings (
        id INT PRIMARY KEY,
        site_name VARCHAR(255),
        site_subtitle VARCHAR(255),
        site_tagline TEXT,
        announcement TEXT,
        show_announcement BOOLEAN DEFAULT TRUE,
        contact_email VARCHAR(255),
        order_notification_email VARCHAR(255),
        currency VARCHAR(10) DEFAULT 'DZD',
        categories JSON,
        seo_meta_title VARCHAR(255),
        seo_meta_description TEXT,
        seo_keywords TEXT,
        offer_enabled BOOLEAN DEFAULT TRUE,
        offer_title VARCHAR(255),
        offer_subtitle VARCHAR(255),
        offer_discount VARCHAR(50),
        offer_product_id INT DEFAULT 1,
        offer_badge VARCHAR(100),
        offer_image VARCHAR(500)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS products (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        tagline VARCHAR(255),
        category VARCHAR(100),
        price DECIMAL(10,2) NOT NULL,
        original_price DECIMAL(10,2),
        stock_count INT DEFAULT 0,
        image VARCHAR(500),
        description TEXT,
        features JSON,
        colors JSON,
        specs JSON,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS orders (
        id VARCHAR(100) PRIMARY KEY,
        customer_name VARCHAR(255) NOT NULL,
        customer_email VARCHAR(255),
        customer_phone VARCHAR(50) NOT NULL,
        delivery_location VARCHAR(255) NOT NULL,
        latitude VARCHAR(50),
        longitude VARCHAR(50),
        customer_notes TEXT,
        subtotal DECIMAL(10,2) NOT NULL,
        shipping DECIMAL(10,2) NOT NULL,
        total DECIMAL(10,2) NOT NULL,
        payment_method VARCHAR(50) DEFAULT 'cod',
        status VARCHAR(50) DEFAULT 'Processing',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS order_items (
        id INT AUTO_INCREMENT PRIMARY KEY,
        order_id VARCHAR(100) NOT NULL,
        product_id INT,
        product_name VARCHAR(255) NOT NULL,
        price DECIMAL(10,2) NOT NULL,
        quantity INT NOT NULL,
        image VARCHAR(500),
        FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // Optional: Keep file-based schema execution if schema.sql exists
    const schemaPath = path.join(__dirname, '..', 'sql', 'schema.sql');
    if (fs.existsSync(schemaPath)) {
      const schemaSql = fs.readFileSync(schemaPath, 'utf-8');
      const statements = schemaSql
        .split(';')
        .map((s) => s.trim())
        .filter((s) => s.length > 0 && !s.startsWith('--') && !s.toLowerCase().startsWith('use '));

      for (const statement of statements) {
        if (statement.length > 5) {
          try {
            await pool.query(statement);
          } catch {
            // Ignore if already exists
          }
        } 
      }
    }

    // Ensure columns exist on older tables
    try {
      await pool.query('ALTER TABLE products ADD COLUMN colors JSON NULL AFTER features');
    } catch {}
    try {
      await pool.query('ALTER TABLE site_settings ADD COLUMN categories JSON NULL');
    } catch {}
    try {
      await pool.query('ALTER TABLE site_settings ADD COLUMN order_notification_email VARCHAR(255) NULL');
      await pool.query('ALTER TABLE site_settings ADD COLUMN seo_meta_title VARCHAR(255) NULL');
      await pool.query('ALTER TABLE site_settings ADD COLUMN seo_meta_description TEXT NULL');
      await pool.query('ALTER TABLE site_settings ADD COLUMN seo_keywords TEXT NULL');
      await pool.query('ALTER TABLE site_settings ADD COLUMN offer_enabled BOOLEAN DEFAULT TRUE');
      await pool.query('ALTER TABLE site_settings ADD COLUMN offer_title VARCHAR(255) NULL');
      await pool.query('ALTER TABLE site_settings ADD COLUMN offer_subtitle VARCHAR(255) NULL');
      await pool.query('ALTER TABLE site_settings ADD COLUMN offer_discount VARCHAR(50) NULL');
      await pool.query('ALTER TABLE site_settings ADD COLUMN offer_product_id INT DEFAULT 1');
      await pool.query('ALTER TABLE site_settings ADD COLUMN offer_badge VARCHAR(100) NULL');
      await pool.query('ALTER TABLE site_settings ADD COLUMN offer_image VARCHAR(500) NULL');
    } catch {}

    // Seed admin if not exists
    const [existingUsers] = await pool.query('SELECT id FROM users LIMIT 1');
    if (existingUsers.length === 0) {
      const adminUsername = process.env.ADMIN_USERNAME || 'admin';
      const adminEmail = process.env.ADMIN_EMAIL || 'admin@auracommerce.com';
      const adminPassword = process.env.ADMIN_PASSWORD || 'AdminSecurePass2026!';
      const salt = await bcrypt.genSalt(12);
      const passwordHash = await bcrypt.hash(adminPassword, salt);

      await pool.query(
        'INSERT INTO users (username, email, password_hash, role) VALUES (?, ?, ?, ?)',
        [adminUsername, adminEmail, passwordHash, 'admin']
      );
    }

    // Seed settings if not exists
    const [existingSettings] = await pool.query('SELECT id FROM site_settings LIMIT 1');
    if (existingSettings.length === 0) {
      await pool.query(
        `INSERT INTO site_settings (id, site_name, site_subtitle, site_tagline, announcement, show_announcement, contact_email, currency, categories, offer_enabled, offer_title, offer_subtitle, offer_discount, offer_product_id, offer_badge)
         VALUES (1, 'AURA', 'COMMERCE', 'Boutique en ligne en Algérie - Livraison 58 Wilayas', '🚚 Livraison rapide vers 58 Wilayas d''Algérie ! Paiement à la livraison.', 1, 'contact@auracommerce.com', 'DZD', '["Audio", "Wearables", "Tech & Office", "Accessories", "Vêtements", "Lifestyle"]', 1, 'Offre Spéciale : Casque Sans Fil Aura Pro', 'Profitez d''une réduction immédiate de 20% valable cette semaine !', '-20%', 1, 'OFFRE DU MOMENT')`
      );
    }

    isConnectedToMySQL = true;
    console.log('✅ MySQL Database connected and tables initialized successfully!');
  } catch (error) {
    isConnectedToMySQL = false;
    console.warn('\n⚠️  Could not connect to MySQL server with current credentials.');
    console.warn(`    Error: ${error.message}`);
    console.warn('    ℹ️  Running in Resilient Memory Mode until DB_PASSWORD in server/.env is updated.');
    console.warn('    Everything on the website remains fully operational!\n');
  }
}

export async function query(sql, params = []) {
  if (isConnectedToMySQL && pool) {
    const [results] = await pool.execute(sql, params);
    return results;
  }
  return executeFallbackQuery(sql, params);
}

function executeFallbackQuery(sql, params) {
  const normalized = sql.trim().toLowerCase();

  // 1. SELECT from users
  if (normalized.startsWith('select') && normalized.includes('from users')) {
    if (normalized.includes('where username = ?') || normalized.includes('where email = ?')) {
      const user = fallbackState.users.find(
        (u) => u.username === params[0] || u.email === params[0]
      );
      return user ? [user] : [];
    }
    if (normalized.includes('where id = ?')) {
      const user = fallbackState.users.find((u) => u.id === params[0]);
      return user ? [user] : [];
    }
    return fallbackState.users;
  }

  // UPDATE users
  if (normalized.startsWith('update users set username = ?, password_hash = ? where id = ?')) {
    const user = fallbackState.users.find((u) => u.id === params[2]);
    if (user) {
      user.username = params[0];
      user.password_hash = params[1];
      return { affectedRows: 1 };
    }
    return { affectedRows: 0 };
  }

  // 2. SELECT from site_settings
  if (normalized.startsWith('select') && normalized.includes('from site_settings')) {
    return [fallbackState.site_settings];
  }

  // 3. UPDATE site_settings
  if (normalized.startsWith('update site_settings')) {
    fallbackState.site_settings = {
      ...fallbackState.site_settings,
      site_name: params[0],
      site_subtitle: params[1],
      site_tagline: params[2],
      announcement: params[3],
      show_announcement: Boolean(params[4]),
      contact_email: params[5],
      order_notification_email: params[6] || params[5] || 'admin@auracommerce.com',
      currency: params[7] || 'DZD',
      categories: typeof params[8] === 'string' ? JSON.parse(params[8]) : params[8],
      seo_meta_title: params[9],
      seo_meta_description: params[10],
      seo_keywords: params[11],
      offer_enabled: Boolean(params[12]),
      offer_title: params[13],
      offer_subtitle: params[14],
      offer_discount: params[15],
      offer_product_id: params[16],
      offer_badge: params[17],
      offer_image: params[18],
    };
    return { affectedRows: 1 };
  }

  // 4. SELECT from products
  if (normalized.startsWith('select') && normalized.includes('from products')) {
    if (normalized.includes('where id = ?')) {
      const prod = fallbackState.products.find((p) => p.id === parseInt(params[0], 10));
      return prod ? [prod] : [];
    }
    return fallbackState.products;
  }

  // 5. INSERT into products
  if (normalized.startsWith('insert into products')) {
    const newId =
      fallbackState.products.length > 0
        ? Math.max(...fallbackState.products.map((p) => p.id)) + 1
        : 1;

    const newProd = {
      id: newId,
      name: params[0],
      tagline: params[1],
      category: params[2],
      price: parseFloat(params[3]),
      original_price: params[4] ? parseFloat(params[4]) : null,
      stock_count: parseInt(params[5], 10) || 0,
      image: params[6],
      description: params[7],
      features: typeof params[8] === 'string' ? JSON.parse(params[8]) : params[8],
      colors: typeof params[9] === 'string' ? JSON.parse(params[9]) : params[9] || [],
      specs: typeof params[10] === 'string' ? JSON.parse(params[10]) : params[10],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    fallbackState.products.unshift(newProd);
    return { insertId: newId, affectedRows: 1 };
  }

  // 6. UPDATE products
  if (normalized.startsWith('update products')) {
    const id = parseInt(params[params.length - 1], 10);
    const index = fallbackState.products.findIndex((p) => p.id === id);
    if (index !== -1) {
      fallbackState.products[index] = {
        ...fallbackState.products[index],
        name: params[0],
        tagline: params[1],
        category: params[2],
        price: parseFloat(params[3]),
        original_price: params[4] ? parseFloat(params[4]) : null,
        stock_count: parseInt(params[5], 10) || 0,
        image: params[6],
        description: params[7],
        features: typeof params[8] === 'string' ? JSON.parse(params[8]) : params[8],
        colors: typeof params[9] === 'string' ? JSON.parse(params[9]) : params[9] || [],
        specs: typeof params[10] === 'string' ? JSON.parse(params[10]) : params[10],
        updated_at: new Date().toISOString(),
      };
      return { affectedRows: 1 };
    }
    return { affectedRows: 0 };
  }

  // 7. DELETE from products
  if (normalized.startsWith('delete from products')) {
    const id = parseInt(params[0], 10);
    const prevLen = fallbackState.products.length;
    fallbackState.products = fallbackState.products.filter((p) => p.id !== id);
    return { affectedRows: prevLen - fallbackState.products.length };
  }

  // 8. SELECT from orders
  if (normalized.startsWith('select') && normalized.includes('from orders')) {
    if (normalized.includes('where id = ?')) {
      const order = fallbackState.orders.find((o) => o.id === params[0]);
      return order ? [order] : [];
    }
    return fallbackState.orders;
  }

  // 9. INSERT into orders
  if (normalized.startsWith('insert into orders')) {
    const newOrder = {
      id: params[0],
      customer_name: params[1],
      customer_email: params[2],
      customer_phone: params[3],
      delivery_location: params[4],
      latitude: params[5],
      longitude: params[6],
      customer_notes: params[7],
      subtotal: parseFloat(params[8]),
      shipping: parseFloat(params[9]),
      total: parseFloat(params[10]),
      payment_method: 'cod',
      status: 'Processing',
      created_at: new Date().toISOString(),
    };
    fallbackState.orders.unshift(newOrder);
    return { affectedRows: 1 };
  }

  // 10. INSERT into order_items
  if (normalized.startsWith('insert into order_items')) {
    const item = {
      id: fallbackState.order_items.length + 1,
      order_id: params[0],
      product_id: params[1],
      product_name: params[2],
      price: parseFloat(params[3]),
      quantity: parseInt(params[4], 10),
      image: params[5],
    };
    fallbackState.order_items.push(item);
    return { affectedRows: 1 };
  }

  // 11. SELECT from order_items
  if (normalized.startsWith('select') && normalized.includes('from order_items')) {
    if (normalized.includes('where order_id = ?')) {
      return fallbackState.order_items.filter((i) => i.order_id === params[0]);
    }
    return fallbackState.order_items;
  }

  // 12. UPDATE orders status
  if (normalized.startsWith('update orders set status = ?')) {
    const status = params[0];
    const orderId = params[1];
    const target = fallbackState.orders.find((o) => o.id === orderId);
    if (target) {
      target.status = status;
      return { affectedRows: 1 };
    }
    return { affectedRows: 0 };
  }

  // 13. DELETE from orders
  if (normalized.startsWith('delete from orders')) {
    const id = params[0];
    fallbackState.orders = fallbackState.orders.filter((o) => o.id !== id);
    fallbackState.order_items = fallbackState.order_items.filter((i) => i.order_id !== id);
    return { affectedRows: 1 };
  }

  return [];
}

export function isUsingMySQL() {
  return isConnectedToMySQL;
}