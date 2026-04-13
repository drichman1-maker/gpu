-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Brands Table
CREATE TABLE brands (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE NOT NULL,
  website TEXT,
  logo_url TEXT,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Categories Table
CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE NOT NULL,
  parent_id UUID REFERENCES categories(id),
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Robots Table (The Core Entity)
CREATE TABLE robots (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  brand_id UUID REFERENCES brands(id) NOT NULL,
  category_id UUID REFERENCES categories(id) NOT NULL,
  model_name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE NOT NULL,
  status VARCHAR(50) DEFAULT 'released', -- announced, released, discontinued
  release_date DATE,
  main_image TEXT,
  image_gallery TEXT[], -- Array of URLs
  meta_title TEXT,
  meta_description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Features Dictionary
CREATE TABLE features (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE NOT NULL,
  category_id UUID REFERENCES categories(id),
  description TEXT,
  data_type VARCHAR(50) DEFAULT 'boolean' -- boolean, number, string
);

-- Robot_Features Junction (Many-to-Many)
CREATE TABLE robot_features (
  robot_id UUID REFERENCES robots(id) ON DELETE CASCADE,
  feature_id UUID REFERENCES features(id) ON DELETE CASCADE,
  value_text TEXT,
  value_number NUMERIC,
  value_boolean BOOLEAN,
  PRIMARY KEY (robot_id, feature_id)
);

-- Retailers
CREATE TABLE retailers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE NOT NULL,
  base_url TEXT,
  affiliate_tag TEXT
);

-- Prices (History)
CREATE TABLE prices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  robot_id UUID REFERENCES robots(id) NOT NULL,
  retailer_id UUID REFERENCES retailers(id) NOT NULL,
  currency VARCHAR(3) DEFAULT 'USD',
  amount NUMERIC(10, 2) NOT NULL,
  url TEXT NOT NULL,
  is_promo BOOLEAN DEFAULT FALSE,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Autonomy Scores (Computed)
CREATE TABLE autonomy_scores (
  robot_id UUID PRIMARY KEY REFERENCES robots(id) ON DELETE CASCADE,
  navigation_score INTEGER CHECK (navigation_score BETWEEN 0 AND 100),
  obstacle_avoidance_score INTEGER CHECK (obstacle_avoidance_score BETWEEN 0 AND 100),
  automation_level INTEGER CHECK (automation_level BETWEEN 0 AND 100),
  maintenance_independence INTEGER CHECK (maintenance_independence BETWEEN 0 AND 100),
  total_score INTEGER CHECK (total_score BETWEEN 0 AND 100),
  generated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX idx_robots_slug ON robots(slug);
CREATE INDEX idx_brands_slug ON brands(slug);
CREATE INDEX idx_categories_slug ON categories(slug);
CREATE INDEX idx_prices_robot_id ON prices(robot_id);
CREATE INDEX idx_robot_features_robot_id ON robot_features(robot_id);
