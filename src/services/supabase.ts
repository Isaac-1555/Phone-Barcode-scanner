const SUPABASE_URL = 'https://jahcgdgmdasrhzcuynkw.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImphaGNnZGdtZGFzcmh6Y3V5bmt3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ5NzI3NDcsImV4cCI6MjA5MDU0ODc0N30.GfErij5lvZIsvGhSq4WsIf-AEhugNXw02nzgQXx5xHw';

function simpleHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return hash.toString(36);
}

export async function hashPassword(password: string): Promise<string> {
  return simpleHash(password);
}

export interface LoginResult {
  storeNumber: string;
  storeId: string;
  passwordHash: string;
}

export async function login(storeNumber: string, password: string): Promise<LoginResult> {
  const passwordHash = await hashPassword(password);

  const response = await fetch(
    `${SUPABASE_URL}/rest/v1/stores?store_number=eq.${encodeURIComponent(storeNumber)}&select=*&limit=1`,
    {
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
      },
    }
  );

  const data = await response.json().catch(() => []);

  if (!response.ok) {
    console.error('Login error:', response.status, data);
    throw new Error(`Server error: ${response.status}`);
  }

  let storeId: string;

  if (data && data.length > 0) {
    if (data[0].password_hash !== passwordHash) {
      throw new Error('Invalid password');
    }
    storeId = data[0].id;
  } else {
    const createResponse = await fetch(`${SUPABASE_URL}/rest/v1/stores`, {
      method: 'POST',
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
        Prefer: 'return=representation',
      },
      body: JSON.stringify({
        store_number: storeNumber,
        password_hash: passwordHash,
      }),
    });

    if (!createResponse.ok) {
      throw new Error('Failed to create account');
    }

    const newStore = await createResponse.json();
    storeId = newStore[0]?.id || newStore.id;
  }

  return {
    storeNumber,
    storeId,
    passwordHash,
  };
}

export async function logout(): Promise<void> {
}

export interface ScannedItem {
  barcode: string;
  comment: string;
}

export async function getNextListNumber(storeId: string, prefix: string): Promise<string> {
  const response = await fetch(
    `${SUPABASE_URL}/rest/v1/barcodes?store_id=eq.${storeId}&category_name=like.${prefix}%25&select=category_name&order=category_name.desc&limit=1`,
    {
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      },
    }
  );

  const data = await response.json().catch(() => []);
  
  let nextNum = 1;
  if (data && data.length > 0) {
    const lastName = data[0].category_name;
    const lastNum = parseInt(lastName.split('-')[1], 10);
    if (!isNaN(lastNum)) {
      nextNum = lastNum + 1;
    }
  }

  return `${prefix}-${nextNum.toString().padStart(2, '0')}`;
}

export async function submitList(storeId: string, categoryName: string, barcodes: ScannedItem[]): Promise<boolean> {
  const insertData = barcodes.map((item) => ({
    store_id: storeId,
    category_name: categoryName,
    barcode_value: item.barcode,
  }));

  const response = await fetch(`${SUPABASE_URL}/rest/v1/barcodes`, {
    method: 'POST',
    headers: {
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      'Content-Type': 'application/json',
      Prefer: 'return=minimal',
    },
    body: JSON.stringify(insertData),
  });

  if (!response.ok) {
    throw new Error('Failed to save barcodes');
  }

  for (const item of barcodes) {
    if (item.comment && item.comment.trim()) {
      await saveComment(storeId, item.barcode, item.comment);
    }
  }

  return true;
}

export async function markCategoryImportant(
  storeId: string,
  categoryName: string,
  isImportant: boolean
): Promise<void> {
  if (isImportant) {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/important_categories`, {
      method: 'POST',
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
        Prefer: 'return=minimal',
      },
      body: JSON.stringify({
        store_id: storeId,
        category_name: categoryName,
      }),
    });
    if (!response.ok && response.status !== 409) {
      throw new Error('Failed to mark list as important');
    }
  } else {
    await fetch(
      `${SUPABASE_URL}/rest/v1/important_categories?store_id=eq.${storeId}&category_name=eq.${encodeURIComponent(categoryName)}`,
      {
        method: 'DELETE',
        headers: {
          apikey: SUPABASE_ANON_KEY,
          Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        },
      }
    );
  }
}

export interface CategoryInfo {
  name: string;
  important: boolean;
  opened: boolean;
}

export async function getCategories(storeId: string): Promise<CategoryInfo[]> {
  const [barcodesRes, importantRes, openedRes] = await Promise.all([
    fetch(
      `${SUPABASE_URL}/rest/v1/barcodes?store_id=eq.${storeId}&select=category_name&order=category_name`,
      {
        headers: {
          apikey: SUPABASE_ANON_KEY,
          Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        },
      }
    ),
    fetch(
      `${SUPABASE_URL}/rest/v1/important_categories?store_id=eq.${storeId}&select=category_name`,
      {
        headers: {
          apikey: SUPABASE_ANON_KEY,
          Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        },
      }
    ),
    fetch(
      `${SUPABASE_URL}/rest/v1/opened_categories?store_id=eq.${storeId}&select=category_name`,
      {
        headers: {
          apikey: SUPABASE_ANON_KEY,
          Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        },
      }
    ),
  ]);

  const [barcodesData, importantData, openedData] = await Promise.all([
    barcodesRes.json().catch(() => []),
    importantRes.json().catch(() => []),
    openedRes.json().catch(() => []),
  ]);

  const importantSet = new Set(
    (Array.isArray(importantData) ? importantData : []).map(
      (r: { category_name: string }) => r.category_name.trim()
    )
  );

  const openedSet = new Set(
    (Array.isArray(openedData) ? openedData : []).map(
      (r: { category_name: string }) => r.category_name.trim()
    )
  );

  const seen = new Set<string>();
  const categories: CategoryInfo[] = [];

  for (const row of Array.isArray(barcodesData) ? barcodesData : []) {
    const name = row.category_name?.trim();
    if (name && !seen.has(name)) {
      seen.add(name);
      categories.push({
        name,
        important: importantSet.has(name),
        opened: openedSet.has(name),
      });
    }
  }

  return categories;
}

export async function markCategoryOpened(storeId: string, categoryName: string): Promise<void> {
  await fetch(
    `${SUPABASE_URL}/rest/v1/opened_categories?on_conflict=store_id,category_name`,
    {
      method: 'POST',
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
        Prefer: 'resolution=merge-duplicates',
      },
      body: JSON.stringify({
        store_id: storeId,
        category_name: categoryName,
        opened_at: new Date().toISOString(),
      }),
    }
  );
}

export async function getCategoryBarcodes(
  storeId: string,
  categoryName: string
): Promise<ScannedItem[]> {
  const response = await fetch(
    `${SUPABASE_URL}/rest/v1/barcodes?store_id=eq.${storeId}&category_name=eq.${encodeURIComponent(categoryName)}&select=barcode_value,created_at&order=created_at`,
    {
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      },
    }
  );

  const data = await response.json().catch(() => []);

  const items: ScannedItem[] = [];
  for (const row of Array.isArray(data) ? data : []) {
    if (row.barcode_value) {
      items.push({ barcode: row.barcode_value, comment: '' });
    }
  }

  const commentsResponse = await fetch(
    `${SUPABASE_URL}/rest/v1/barcode_comments?store_id=eq.${storeId}&select=barcode_value,comment`,
    {
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      },
    }
  );
  const commentsData = await commentsResponse.json().catch(() => []);
  const commentMap: Record<string, string> = {};
  for (const row of Array.isArray(commentsData) ? commentsData : []) {
    if (row.comment) commentMap[row.barcode_value] = row.comment;
  }

  return items.map((item) => ({
    ...item,
    comment: commentMap[item.barcode] || '',
  }));
}

export async function saveComment(storeId: string, barcodeValue: string, comment: string): Promise<void> {
  const truncated = comment.slice(0, 250);

  await fetch(
    `${SUPABASE_URL}/rest/v1/barcode_comments?on_conflict=store_id,barcode_value`,
    {
      method: 'POST',
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
        Prefer: 'resolution=merge-duplicates',
      },
      body: JSON.stringify({
        store_id: storeId,
        barcode_value: barcodeValue,
        comment: truncated,
        updated_at: new Date().toISOString(),
      }),
    }
  );
}