CREATE TABLE IF NOT EXISTS important_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid REFERENCES stores(id) ON DELETE CASCADE,
  category_name text NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(store_id, category_name)
);

ALTER TABLE important_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow anonymous select" ON important_categories
  FOR SELECT USING (true);

CREATE POLICY "Allow anonymous insert" ON important_categories
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow anonymous delete" ON important_categories
  FOR DELETE USING (true);

CREATE INDEX IF NOT EXISTS idx_important_categories_store ON important_categories(store_id);
