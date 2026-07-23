CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE furniture_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    url TEXT NOT NULL,
    title TEXT NOT NULL,
    price NUMERIC,
    category TEXT,
    room TEXT,
    status TEXT DEFAULT 'Da valutare',
    notes TEXT,
    image_url TEXT,
    vendor TEXT
);

-- RLS policies
ALTER TABLE furniture_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read" ON furniture_items FOR SELECT USING (true);
CREATE POLICY "Allow public insert" ON furniture_items FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update" ON furniture_items FOR UPDATE USING (true);
CREATE POLICY "Allow public delete" ON furniture_items FOR DELETE USING (true);
