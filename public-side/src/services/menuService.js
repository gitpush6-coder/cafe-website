import { collection, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';

/**
 * Fetch categories from Firestore.
 * In-memory sort by "order" so documents without an "order" field are not dropped.
 * Collection: "categories"
 * @returns {Promise<Array>}
 */
export async function getCategories() {
  try {
    const snapshot = await getDocs(collection(db, 'categories'));

    const results = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data()
    }));

    // In-memory sort by order as a safety guarantee
    results.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
    return results;
  } catch (error) {
    console.error('Firestore error in getCategories:', error);
    throw error;
  }
}

/**
 * Fetch menu items from Firestore with optional category, veg-only, and search filters.
 * Collection: "menuItems"
 * @param {Object} options
 * @param {string} [options.category] - Category slug, ID, or 'all'
 * @param {boolean} [options.vegOnly] - Filter for vegetarian only
 * @param {string} [options.searchQuery] - Search text for name or description
 * @returns {Promise<Array>}
 */
export async function getMenuItems({ category = 'all', vegOnly = false, searchQuery = '' } = {}) {
  try {
    const snapshot = await getDocs(collection(db, 'menuItems'));
    let results = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data()
    }));

    // Normalize pricing and boolean flags for safe UI rendering
    results = results.map((item) => ({
      ...item,
      price: typeof item.price === 'number' ? item.price : Number(item.price) || 0,
      available: item.available !== undefined ? Boolean(item.available) : true,
      isVeg: Boolean(item.isVeg),
      isPopular: Boolean(item.isPopular)
    }));

    // Category filter: match against item.category, item.slug, or item.categoryId (case-insensitive)
    if (category && category !== 'all') {
      const target = String(category).toLowerCase().trim();
      results = results.filter((item) => {
        const itemCat = String(item.category || '').toLowerCase().trim();
        const itemSlug = String(item.slug || '').toLowerCase().trim();
        const itemCatId = String(item.categoryId || '').toLowerCase().trim();
        return itemCat === target || itemSlug === target || itemCatId === target;
      });
    }

    // Vegetarian filter
    if (vegOnly) {
      results = results.filter((item) => Boolean(item.isVeg));
    }

    // Search query filter (name or description)
    if (searchQuery && searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase().trim();
      results = results.filter(
        (item) =>
          (item.name && item.name.toLowerCase().includes(q)) ||
          (item.description && item.description.toLowerCase().includes(q))
      );
    }

    return results;
  } catch (error) {
    console.error('Firestore error in getMenuItems:', error);
    throw error;
  }
}

/**
 * Fetch popular menu items for homepage highlight.
 * Collection: "menuItems" (where isPopular == true)
 * @param {number} limit
 * @returns {Promise<Array>}
 */
export async function getPopularMenuItems(limit = 4) {
  try {
    const snapshot = await getDocs(collection(db, 'menuItems'));
    const allItems = snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        price: typeof data.price === 'number' ? data.price : Number(data.price) || 0,
        available: data.available !== undefined ? Boolean(data.available) : true,
        isVeg: Boolean(data.isVeg),
        isPopular: Boolean(data.isPopular)
      };
    });

    const popular = allItems.filter((item) => Boolean(item.isPopular)).slice(0, limit);
    return popular;
  } catch (error) {
    console.error('Firestore error in getPopularMenuItems:', error);
    throw error;
  }
}
