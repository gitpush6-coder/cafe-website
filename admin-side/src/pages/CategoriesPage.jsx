import React, { useState, useMemo } from "react";
import {
  Plus,
  ArrowUp,
  ArrowDown,
  Edit2,
  Trash2,
  Tags,
  AlertCircle
} from "lucide-react";
import { useCategories } from "../hooks/useCategories";
import { useMenuItems } from "../hooks/useMenuItems";
import { useToast } from "../context/ToastContext";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { Textarea } from "../components/ui/Textarea";
import { Modal } from "../components/ui/Modal";
import { ConfirmDialog } from "../components/ui/ConfirmDialog";
import { Badge } from "../components/ui/Badge";
import { TableSkeleton } from "../components/ui/SkeletonLoader";
import { EmptyState } from "../components/ui/EmptyState";

export const CategoriesPage = () => {
  const {
    categories,
    loading: catLoading,
    addCategory,
    updateCategory,
    deleteCategory,
    moveCategory
  } = useCategories();
  const { items, loading: itemsLoading } = useMenuItems();
  const { showToast } = useToast();

  // Modal form states
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Delete target state
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Item counts per category slug
  const itemCounts = useMemo(() => {
    const counts = {};
    items.forEach((item) => {
      const slug = item.category;
      counts[slug] = (counts[slug] || 0) + 1;
    });
    return counts;
  }, [items]);

  const openAddModal = () => {
    setEditingCategory(null);
    setName("");
    setDescription("");
    setError("");
    setIsFormOpen(true);
  };

  const openEditModal = (cat) => {
    setEditingCategory(cat);
    setName(cat.name);
    setDescription(cat.description || "");
    setError("");
    setIsFormOpen(true);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("Category name is required.");
      return;
    }

    try {
      setIsSubmitting(true);
      if (editingCategory) {
        await updateCategory(editingCategory.id, { name, description });
      } else {
        await addCategory({ name, description });
      }
      setIsFormOpen(false);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteRequest = (cat) => {
    const count = itemCounts[cat.slug] || 0;
    if (count > 0) {
      showToast(
        `Cannot delete "${cat.name}": There are ${count} menu item(s) currently assigned to this category. Please reassign or delete them first.`,
        "error",
        5500
      );
      return;
    }
    setDeleteTarget(cat);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    try {
      setIsDeleting(true);
      await deleteCategory(deleteTarget.id);
      setDeleteTarget(null);
    } catch (err) {
      // Toast handles error
    } finally {
      setIsDeleting(false);
    }
  };

  const handleMove = async (id, direction) => {
    try {
      await moveCategory(id, direction);
    } catch (err) {
      // Toast handles error
    }
  };

  const isLoading = catLoading || itemsLoading;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-espresso/10">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="font-serif text-2xl sm:text-3xl font-bold text-espresso tracking-tight">
              Menu Categories
            </h1>
            <Badge variant="default" size="sm">
              {categories.length} Total
            </Badge>
          </div>
          <p className="text-sm text-espresso/60 mt-1">
            Reorder, rename, or add categories. Used to filter the public menu.
          </p>
        </div>

        <Button
          variant="primary"
          size="md"
          onClick={openAddModal}
          leftIcon={<Plus className="w-4 h-4" />}
        >
          Add Category
        </Button>
      </div>

      {/* Safety Notice Banner */}
      <div className="p-4 rounded-xl bg-cream-light border border-espresso/10 flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-terracotta flex-shrink-0 mt-0.5" />
        <div className="text-xs text-espresso/80 leading-relaxed">
          <span className="font-bold text-espresso">Safety Rule:</span> Categories cannot be deleted while they contain active menu items. Reassign items to another category before deleting. Use the arrow buttons to adjust the display order on the public menu chips.
        </div>
      </div>

      {/* List / Table */}
      {isLoading ? (
        <TableSkeleton rows={4} />
      ) : categories.length === 0 ? (
        <EmptyState
          icon={Tags}
          title="No categories yet"
          description="Create your first category (e.g. Coffee, Teas, Artisan Bakes, Beverages) to organize your café menu."
          actionLabel="Add Category"
          onAction={openAddModal}
        />
      ) : (
        <div className="bg-white/90 rounded-2xl border border-espresso/10 shadow-warm overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-espresso/10 bg-cream-light/60 text-[11px] font-bold uppercase tracking-wider text-espresso/70">
                <th className="py-3.5 pl-6 pr-3 w-16">Order</th>
                <th className="py-3.5 px-4">Category Name</th>
                <th className="py-3.5 px-4 hidden sm:table-cell">Slug Key</th>
                <th className="py-3.5 px-4">Menu Items</th>
                <th className="py-3.5 pl-3 pr-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-espresso/5 text-sm">
              {categories.map((cat, idx) => {
                const count = itemCounts[cat.slug] || 0;
                const isFirst = idx === 0;
                const isLast = idx === categories.length - 1;

                return (
                  <tr
                    key={cat.id}
                    className="hover:bg-cream-light/30 transition-colors"
                  >
                    {/* Order column with Move Up / Down */}
                    <td className="py-4 pl-6 pr-3">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-xs text-espresso/50 w-5">
                          #{cat.order || idx + 1}
                        </span>
                        <div className="flex flex-col gap-0.5">
                          <button
                            type="button"
                            disabled={isFirst}
                            onClick={() => handleMove(cat.id, "up")}
                            className="p-1 rounded hover:bg-espresso/10 text-espresso/60 disabled:opacity-20 disabled:hover:bg-transparent"
                            title="Move Up"
                          >
                            <ArrowUp className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            disabled={isLast}
                            onClick={() => handleMove(cat.id, "down")}
                            className="p-1 rounded hover:bg-espresso/10 text-espresso/60 disabled:opacity-20 disabled:hover:bg-transparent"
                            title="Move Down"
                          >
                            <ArrowDown className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </td>

                    {/* Category Name & Description */}
                    <td className="py-4 px-4">
                      <div>
                        <span className="font-semibold text-espresso block">
                          {cat.name}
                        </span>
                        {cat.description && (
                          <span className="text-xs text-espresso/60 block mt-0.5">
                            {cat.description}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Slug */}
                    <td className="py-4 px-4 hidden sm:table-cell">
                      <code className="text-xs bg-cream-light px-2 py-1 rounded text-espresso/70 border border-espresso/10">
                        {cat.slug}
                      </code>
                    </td>

                    {/* Menu Items Count */}
                    <td className="py-4 px-4">
                      <Badge
                        variant={count > 0 ? "secondary" : "default"}
                        size="sm"
                      >
                        {count} item{count !== 1 ? "s" : ""}
                      </Badge>
                    </td>

                    {/* Actions */}
                    <td className="py-4 pl-3 pr-6 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => openEditModal(cat)}
                          className="p-1.5 rounded-lg text-espresso/70 hover:text-espresso hover:bg-espresso/10 transition-colors"
                          title="Rename / Edit"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteRequest(cat)}
                          className={`p-1.5 rounded-lg transition-colors ${
                            count > 0
                              ? "text-espresso/30 hover:text-red-500 cursor-not-allowed"
                              : "text-red-600 hover:bg-red-50"
                          }`}
                          title={
                            count > 0
                              ? `Cannot delete: ${count} item(s) in category`
                              : "Delete Category"
                          }
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Add / Edit Category Modal */}
      <Modal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        title={editingCategory ? "Rename Category" : "Add New Category"}
        subtitle="Categories organize items on both the public menu and admin table."
        maxWidth="max-w-md"
      >
        <form onSubmit={handleFormSubmit} className="space-y-4">
          <Input
            label="Category Name"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              setError("");
            }}
            placeholder="e.g. Seasonal Specials"
            error={error}
            required
          />

          <Textarea
            label="Description (Optional)"
            rows={2}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Brief description of this section..."
          />

          <div className="pt-4 border-t border-espresso/10 flex items-center justify-end gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsFormOpen(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              isLoading={isSubmitting}
            >
              {editingCategory ? "Save Changes" : "Create Category"}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDeleteConfirm}
        title="Delete Category"
        message={`Are you sure you want to permanently delete category "${deleteTarget?.name}"?`}
        confirmLabel="Delete Category"
        variant="danger"
        isLoading={isDeleting}
      />
    </div>
  );
};
