-- ==============================================================================
-- Aura E-Commerce Database Schema (Algeria Edition - DZD & Wilayas)
-- SQL Injection Proofed & Normalized MySQL Schema
-- ==============================================================================

CREATE DATABASE IF NOT EXISTS aura_ecommerce
CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;

USE aura_ecommerce;

-- 1. Users Table (Admin Authentication)
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(50) NOT NULL UNIQUE,
  email VARCHAR(100) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(20) NOT NULL DEFAULT 'admin',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_users_username (username),
  INDEX idx_users_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Site Settings Table
CREATE TABLE IF NOT EXISTS site_settings (
  id INT PRIMARY KEY DEFAULT 1,
  site_name VARCHAR(100) NOT NULL DEFAULT 'AURA',
  site_subtitle VARCHAR(100) NOT NULL DEFAULT 'COMMERCE',
  site_tagline VARCHAR(255) DEFAULT 'Boutique en ligne en Algérie - Livraison 58 Wilayas',
  announcement VARCHAR(255) DEFAULT '🚚 Livraison rapide vers 58 Wilayas d\'Algérie ! Paiement à la livraison.',
  show_announcement BOOLEAN NOT NULL DEFAULT TRUE,
  contact_email VARCHAR(100) DEFAULT 'contact@auracommerce.com',
  currency VARCHAR(10) NOT NULL DEFAULT 'DZD',
  categories JSON NULL,
  seo_meta_title VARCHAR(255) DEFAULT 'AURA Commerce | Vente en ligne en Algérie - DZD',
  seo_meta_description TEXT NULL,
  seo_keywords TEXT NULL,
  offer_enabled BOOLEAN DEFAULT TRUE,
  offer_title VARCHAR(255) DEFAULT 'Offre Spéciale : Casque Sans Fil Aura Pro',
  offer_subtitle VARCHAR(255) DEFAULT 'Profitez d\'une réduction immédiate de 20% valable cette semaine !',
  offer_discount VARCHAR(50) DEFAULT '-20%',
  offer_product_id INT DEFAULT 1,
  offer_badge VARCHAR(100) DEFAULT 'OFFRE DU MOMENT',
  offer_image VARCHAR(500) NULL,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Products Catalog Table
CREATE TABLE IF NOT EXISTS products (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  tagline VARCHAR(255) NULL,
  category VARCHAR(100) NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  original_price DECIMAL(10, 2) NULL,
  stock_count INT NOT NULL DEFAULT 10,
  image VARCHAR(500) NOT NULL,
  description TEXT NULL,
  features JSON NULL,
  colors JSON NULL,
  specs JSON NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_products_category (category),
  INDEX idx_products_price (price)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Customer Orders Table
CREATE TABLE IF NOT EXISTS orders (
  id VARCHAR(50) PRIMARY KEY,
  customer_name VARCHAR(100) NOT NULL,
  customer_email VARCHAR(150) NOT NULL,
  customer_phone VARCHAR(50) NOT NULL,
  delivery_location TEXT NOT NULL,
  latitude DECIMAL(10, 8) NULL,
  longitude DECIMAL(11, 8) NULL,
  customer_notes TEXT NULL,
  subtotal DECIMAL(10, 2) NOT NULL,
  shipping DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  total DECIMAL(10, 2) NOT NULL,
  payment_method VARCHAR(50) NOT NULL DEFAULT 'cod',
  status VARCHAR(50) NOT NULL DEFAULT 'Processing',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_orders_status (status),
  INDEX idx_orders_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. Order Items Table
CREATE TABLE IF NOT EXISTS order_items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  order_id VARCHAR(50) NOT NULL,
  product_id INT NULL,
  product_name VARCHAR(255) NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  quantity INT NOT NULL,
  image VARCHAR(500) NULL,
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
  INDEX idx_order_items_order_id (order_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
