-- migrations.sql
CREATE TABLE
  IF NOT EXISTS buildings (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    address TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );

CREATE TABLE
  IF NOT EXISTS apartments (
    id SERIAL PRIMARY KEY,
    building_id INTEGER NOT NULL REFERENCES buildings (id) ON DELETE CASCADE,
    unit_number TEXT NOT NULL,
    owner_name TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (building_id, unit_number)
  );

CREATE TABLE
  IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    phone TEXT UNIQUE,
    name TEXT,
    email TEXT,
    password_hash TEXT,
    role TEXT NOT NULL DEFAULT 'resident', -- resident|building_admin|super_admin
    building_id INTEGER REFERENCES buildings (id) ON DELETE SET NULL,
    apartment_id INTEGER REFERENCES apartments (id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP
  );

-- Drop and recreate the notices table
CREATE TABLE
  IF NOT EXISTS notices (
    id SERIAL PRIMARY KEY,
    building_id INTEGER NOT NULL REFERENCES buildings (id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    body TEXT, -- Changed from content to body, made nullable
    category VARCHAR(50) DEFAULT 'general',
    priority VARCHAR(20) DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
    visible BOOLEAN DEFAULT TRUE,
    expires_at TIMESTAMP
    WITH
      TIME ZONE,
      created_by INTEGER REFERENCES users (id) ON DELETE SET NULL,
      created_at TIMESTAMP
    WITH
      TIME ZONE DEFAULT NOW (),
      updated_at TIMESTAMP
    WITH
      TIME ZONE DEFAULT NOW ()
  );

-- Create indexes
CREATE INDEX idx_notices_building_id ON notices (building_id);

CREATE INDEX idx_notices_visible ON notices (visible);

CREATE INDEX idx_notices_created_at ON notices (created_at DESC);

-- First, create the apartment_maintenance table
CREATE TABLE IF NOT EXISTS apartment_maintenance (
    id SERIAL PRIMARY KEY,
    building_id INTEGER NOT NULL REFERENCES buildings(id) ON DELETE CASCADE,
    apartment_id INTEGER NOT NULL REFERENCES apartments(id) ON DELETE CASCADE,
    monthly_amount DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    effective_from DATE NOT NULL DEFAULT CURRENT_DATE,
    effective_to DATE,
    is_active BOOLEAN DEFAULT TRUE,
    created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(apartment_id, effective_from)
);

-- Then, create the extra_payments table
CREATE TABLE IF NOT EXISTS extra_payments (
    id SERIAL PRIMARY KEY,
    building_id INTEGER NOT NULL REFERENCES buildings(id) ON DELETE CASCADE,
    apartment_id INTEGER REFERENCES apartments(id) ON DELETE CASCADE,
    bill_name VARCHAR(255) NOT NULL,
    description TEXT,
    amount DECIMAL(10, 2) NOT NULL,
    currency VARCHAR(10) DEFAULT 'INR',
    due_date DATE NOT NULL,
    is_recurring BOOLEAN DEFAULT FALSE,
    recurrence_frequency VARCHAR(20) CHECK (recurrence_frequency IN ('monthly', 'quarterly', 'yearly')),
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'cancelled', 'completed')),
    applied_to_all BOOLEAN DEFAULT FALSE,
    created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);


CREATE TABLE payments (
    id SERIAL PRIMARY KEY,
    building_id INTEGER REFERENCES buildings (id) ON DELETE CASCADE,
    apartment_id INTEGER REFERENCES apartments (id) ON DELETE SET NULL,
    bill_name TEXT NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    currency TEXT DEFAULT 'INR',
    status TEXT DEFAULT 'unpaid' CHECK (status IN ('unpaid', 'paid', 'cancelled')),
    due_date DATE,
    bill_type VARCHAR(20) DEFAULT 'maintenance' CHECK (bill_type IN ('maintenance', 'extra', 'other')),
    apartment_maintenance_id INTEGER REFERENCES apartment_maintenance(id) ON DELETE SET NULL,
    extra_payment_id INTEGER REFERENCES extra_payments(id) ON DELETE SET NULL,
    created_by INTEGER REFERENCES users (id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_apartment_maintenance_apartment_id ON apartment_maintenance(apartment_id);
CREATE INDEX IF NOT EXISTS idx_apartment_maintenance_building_id ON apartment_maintenance(building_id);
CREATE INDEX IF NOT EXISTS idx_extra_payments_building_id ON extra_payments(building_id);
CREATE INDEX IF NOT EXISTS idx_extra_payments_apartment_id ON extra_payments(apartment_id);
CREATE INDEX IF NOT EXISTS idx_payments_apartment_maintenance_id ON payments(apartment_maintenance_id);
CREATE INDEX IF NOT EXISTS idx_payments_extra_payment_id ON payments(extra_payment_id);
CREATE INDEX IF NOT EXISTS idx_payments_building_id ON payments(building_id);
CREATE INDEX IF NOT EXISTS idx_payments_apartment_id ON payments(apartment_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_due_date ON payments(due_date);

CREATE TABLE IF NOT EXISTS visitor_passes (
  id SERIAL PRIMARY KEY,
  building_id INTEGER REFERENCES buildings (id) ON DELETE CASCADE,
  apartment_id INTEGER REFERENCES apartments (id) ON DELETE SET NULL,
  code TEXT NOT NULL UNIQUE,
  visitor_name TEXT,
  qr_data TEXT,
  created_by INTEGER REFERENCES users (id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'verified', 'cancelled', 'expired')),
  verified_at TIMESTAMP WITH TIME ZONE,
  verified_by INTEGER REFERENCES users(id) ON DELETE SET NULL
);

-- Create simplified amenities table (common for all buildings)
CREATE TABLE IF NOT EXISTS amenities (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    icon VARCHAR(50) DEFAULT 'location-outline',
    color VARCHAR(20) DEFAULT '#3880ff',
    booking_slots JSONB DEFAULT '[
        {"name": "Full Day", "start": "09:00", "end": "21:00", "max_per_day": 1},
        {"name": "Morning", "start": "09:00", "end": "15:00", "max_per_day": 2},
        {"name": "Evening", "start": "16:00", "end": "21:00", "max_per_day": 2}
    ]'::jsonb,
    operating_hours JSONB DEFAULT '{"start": "08:00", "end": "22:00"}'::jsonb,
    max_capacity INTEGER DEFAULT 50,
    requires_approval BOOLEAN DEFAULT TRUE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(name)
);

-- Insert common amenities (same for all buildings)
INSERT INTO amenities (name, description, icon, color, operating_hours) VALUES
('Party Hall', 'Multi-purpose hall for events and parties', 'business-outline', '#ff6b6b', '{"start": "08:00", "end": "23:00"}'),
('Gym', 'Fitness center with equipment', 'barbell-outline', '#4ecdc4', '{"start": "06:00", "end": "22:00"}'),
('Swimming Pool', 'Community swimming pool', 'water-outline', '#45b7d1', '{"start": "07:00", "end": "21:00"}'),
('Tennis Court', 'Outdoor tennis court', 'tennisball-outline', '#96ceb4', '{"start": "07:00", "end": "20:00"}'),
('Badminton Court', 'Indoor badminton court', 'american-football-outline', '#feca57', '{"start": "08:00", "end": "22:00"}'),
('Children Play Area', 'Kids play zone', 'happy-outline', '#ff9ff3', '{"start": "08:00", "end": "20:00"}'),
('Club House', 'Community gathering space', 'home-outline', '#54a0ff', '{"start": "08:00", "end": "22:00"}'),
('BBQ Area', 'Outdoor barbecue space', 'flame-outline', '#ff9f43', '{"start": "17:00", "end": "22:00"}')
ON CONFLICT (name) DO NOTHING;

-- Create simplified bookings table
CREATE TABLE IF NOT EXISTS bookings (
    id SERIAL PRIMARY KEY,
    building_id INTEGER NOT NULL REFERENCES buildings(id) ON DELETE CASCADE,
    apartment_id INTEGER REFERENCES apartments(id) ON DELETE SET NULL,
    amenity_id INTEGER NOT NULL REFERENCES amenities(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    slot_name VARCHAR(100) NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    purpose TEXT,
    status VARCHAR(20) DEFAULT 'pending' CHECK (
        status IN ('pending', 'approved', 'rejected', 'cancelled')
    ),
    rejection_reason TEXT,
    approved_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    approved_at TIMESTAMP WITH TIME ZONE,
    created_by INTEGER NOT NULL REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for performance
CREATE INDEX idx_bookings_building_id ON bookings(building_id);
CREATE INDEX idx_bookings_amenity_id ON bookings(amenity_id);
CREATE INDEX idx_bookings_date ON bookings(date);
CREATE INDEX idx_bookings_status ON bookings(status);
CREATE INDEX idx_bookings_created_by ON bookings(created_by);
CREATE INDEX idx_bookings_building_amenity_date ON bookings(building_id, amenity_id, date, slot_name);

CREATE TABLE IF NOT EXISTS complaints (
  id SERIAL PRIMARY KEY,
  building_id INTEGER REFERENCES buildings (id) ON DELETE CASCADE,
  apartment_id INTEGER REFERENCES apartments (id),
  type TEXT,
  description TEXT,
  status TEXT DEFAULT 'submitted',
  admin_response TEXT,
  created_by INTEGER REFERENCES users (id),
  resolved_by INTEGER REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  resolved_at TIMESTAMP
);  

CREATE TABLE
  IF NOT EXISTS events (
    id SERIAL PRIMARY KEY,
    building_id INTEGER REFERENCES buildings (id) ON DELETE CASCADE,
    type TEXT NOT NULL,
    ref_id INTEGER,
    message TEXT,
    created_by INTEGER REFERENCES users (id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    read_by_admin BOOLEAN DEFAULT FALSE
  );