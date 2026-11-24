import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
  writeBatch
} from 'firebase/firestore';
import { db } from '../lib/firebase';

export const categoryService = {
  /**
   * Fetch all categories sorted by order
   */
  async getAll() {
    try {
      const snap = await getDocs(collection(db, 'categories'));

      const categories = snap.docs.map((d) => ({
        id: d.id,
        ...d.data()
      }));

      return categories.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
    } catch (err) {
      console.error('Firestore error in categoryService.getAll:', err);
      throw err;
    }
  },

  /**
   * Add a new category
   */
  async create(categoryData) {
    try {
      const slug = (categoryData.slug || categoryData.name)
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');

      const existing = await this.getAll();
      if (existing.some((c) => c.slug === slug)) {
        throw new Error(`Category with slug "${slug}" already exists.`);
      }

      const maxOrder = existing.reduce((max, c) => Math.max(max, c.order ?? 0), 0);

      const payload = {
        name: categoryData.name.trim(),
        slug: slug,
        order: maxOrder + 1,
        description: categoryData.description?.trim() || '',
        updatedAt: serverTimestamp(),
        createdAt: serverTimestamp()
      };

      const docRef = await addDoc(collection(db, 'categories'), payload);
      return { id: docRef.id, ...payload };
    } catch (err) {
      console.error('Firestore error in categoryService.create:', err);
      throw err;
    }
  },

  /**
   * Rename or update category
   */
  async update(id, updates) {
    try {
      const docRef = doc(db, 'categories', id);
      const currentSnap = await getDoc(docRef);
      if (!currentSnap.exists()) {
        throw new Error(`Category with ID "${id}" not found.`);
      }

      const current = currentSnap.data();
      let newSlug = current.slug;
      if (updates.slug) {
        newSlug = updates.slug.toLowerCase().trim();
      } else if (updates.name) {
        newSlug = updates.name.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      }

      const payload = {
        ...updates,
        slug: newSlug,
        name: updates.name ? updates.name.trim() : current.name,
        updatedAt: serverTimestamp()
      };

      await updateDoc(docRef, payload);
      return { id, ...current, ...payload };
    } catch (err) {
      console.error(`Firestore error in categoryService.update(${id}):`, err);
      throw err;
    }
  },

  /**
   * Remove a category
   * SAFETY RULE: Query menuItems where category == id or category == slug; block if count > 0.
   */
  async remove(id) {
    try {
      const docRef = doc(db, 'categories', id);
      const snap = await getDoc(docRef);
      if (!snap.exists()) {
        throw new Error(`Category with ID "${id}" not found.`);
      }

      const catData = snap.data();
      const slug = catData.slug || id;

      // Query menuItems where category matches either the category id or slug
      const qId = query(collection(db, 'menuItems'), where('category', '==', id));
      const snapId = await getDocs(qId);

      const qSlug = query(collection(db, 'menuItems'), where('category', '==', slug));
      const snapSlug = await getDocs(qSlug);

      const linkedSet = new Set([...snapId.docs.map((d) => d.id), ...snapSlug.docs.map((d) => d.id)]);

      if (linkedSet.size > 0) {
        throw new Error(
          `Cannot delete "${catData.name}": There are ${linkedSet.size} active menu item(s) currently assigned to this category. Please reassign or delete them first.`
        );
      }

      await deleteDoc(docRef);
      return true;
    } catch (err) {
      console.error(`Firestore error in categoryService.remove(${id}):`, err);
      throw err;
    }
  },

  /**
   * Reorder categories (move up or down)
   */
  async move(id, direction) {
    try {
      const categories = await this.getAll();
      const index = categories.findIndex((c) => c.id === id);
      if (index === -1) return categories;

      const targetIndex = direction === 'up' ? index - 1 : index + 1;
      if (targetIndex < 0 || targetIndex >= categories.length) return categories;

      const currentCat = categories[index];
      const targetCat = categories[targetIndex];

      const currentOrder = currentCat.order ?? index + 1;
      const targetOrder = targetCat.order ?? targetIndex + 1;

      const batch = writeBatch(db);
      batch.update(doc(db, 'categories', currentCat.id), {
        order: targetOrder,
        updatedAt: serverTimestamp()
      });
      batch.update(doc(db, 'categories', targetCat.id), {
        order: currentOrder,
        updatedAt: serverTimestamp()
      });
      await batch.commit();

      return this.getAll();
    } catch (err) {
      console.error(`Firestore error in categoryService.move(${id}):`, err);
      throw err;
    }
  }
};
