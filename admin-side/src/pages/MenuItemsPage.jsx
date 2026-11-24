import React, { useState, useMemo, useEffect } from "react";
import { useSearchParams, Link } from "react-router-dom";
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  Sparkles,
  Filter,
  CheckCircle,
  XCircle,
  Coffee,
  Image as ImageIcon
} from "lucide-react";
import { useMenuItems } from "../hooks/useMenuItems";
import { useCategories } from "../hooks/useCategories";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { Select } from "../components/ui/Select";
import { Textarea } from "../components/ui/Textarea";
import { ToggleSwitch } from "../components/ui/ToggleSwitch";
import { Modal } from "../components/ui/Modal";
import { ConfirmDialog } from "../components/ui/ConfirmDialog";
import { Badge, VegIndicator } from "../components/ui/Badge";
import { EmptyState } from "../components/ui/EmptyState";
import { TableSkeleton } from "../components/ui/SkeletonLoader";

export const MenuItemsPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const {
    items,
    loading: itemsLoading,
    addItem,
    updateItem,
    deleteItem,
    toggleAvailability,
    togglePopular
  } = useMenuItems();
  const { categories, loading: categoriesLoading } = useCategories();

  // Filters state
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedAvailability, setSelectedAvailability] = useState("all");

  // Modal form state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null); // null if adding new
  const [formValues, setFormValues] = useState({
    name: "",
    category: "",
    price: "",
    description: "",
    imageUrl: "",
    isVeg: true,
    isPopular: false,
    available: true
  });
  const [formErrors, setFormErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Delete dialog state
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Check query param action=new to trigger add modal
  useEffect(() => {
    if (searchParams.get("action") === "new") {
      openAddModal();
      searchParams.delete("action");
      setSearchParams(searchParams, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  const openAddModal = () => {
    setEditingItem(null);
    setFormValues({
      name: "",
      category: categories[0]?.slug || "",
      price: "",
      description: "",
      imageUrl: "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=600&q=80",
      isVeg: true,
      isPopular: false,
      available: true
    });
    setFormErrors({});
    setIsFormOpen(true);
  };

  const openEditModal = (item) => {
    setEditingItem(item);
    setFormValues({
      name: item.name,
      category: item.category,
      price: item.price,
      description: item.description || "",
      imageUrl: item.imageUrl || "",
      isVeg: Boolean(item.isVeg),
      isPopular: Boolean(item.isPopular),
      available: item.available !== undefined ? Boolean(item.available) : true
    });
    setFormErrors({});
    setIsFormOpen(true);
  };

  const validateForm = () => {
    const errors = {};
    if (!formValues.name.trim()) {
      errors.name = "Item name is required";
    }
    if (!formValues.category) {
      errors.category = "Category is required";
    }
    if (formValues.price === "" || isNaN(formValues.price) || Number(formValues.price) <= 0) {
      errors.price = "Valid price in ₹ (> 0) is required";
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      setIsSubmitting(true);
      if (editingItem) {
        await updateItem(editingItem.id, formValues);
      } else {
        await addItem(formValues);
      }
      setIsFormOpen(false);
    } catch (err) {
      // Toast handles error display
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    try {
      setIsDeleting(true);
      await deleteItem(deleteTarget.id);
      setDeleteTarget(null);
    } catch (err) {
      // Toast handles error display
    } finally {
      setIsDeleting(false);
    }
  };

  // Filtered items
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      // Search
      const matchesSearch =
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description?.toLowerCase().includes(searchQuery.toLowerCase());

      // Category
      const matchesCategory =
        selectedCategory === "all" || item.category === selectedCategory;

      // Availability
      const matchesAvailability =
        selectedAvailability === "all" ||
        (selectedAvailability === "available" && item.available) ||
        (selectedAvailability === "soldout" && !item.available);

      return matchesSearch && matchesCategory && matchesAvailability;
    });
  }, [items, searchQuery, selectedCategory, selectedAvailability]);

  const isLoading = itemsLoading || categoriesLoading;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-espresso/10">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="font-serif text-2xl sm:text-3xl font-bold text-espresso tracking-tight">
              Menu Items
            </h1>
            <Badge variant="default" size="sm">
              {items.length} Total
            </Badge>
          </div>
          <p className="text-sm text-espresso/60 mt-1">
            Manage your cafe menu items, pricing, availability toggles, and descriptions.
          </p>
        </div>

        <Button
          variant="primary"
          size="md"
          onClick={openAddModal}
          leftIcon={<Plus className="w-4 h-4" />}
        >
          Add Menu Item
        </Button>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="bg-white/80 p-4 rounded-2xl border border-espresso/10 shadow-warm flex flex-col md:flex-row items-stretch md:items-center gap-3">
        {/* Search Input */}
        <div className="flex-1">
          <Input
            placeholder="Search items by name or description..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            leftIcon={<Search className="w-4 h-4" />}
          />
        </div>

        {/* Category Filter */}
        <div className="w-full md:w-48">
          <Select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
          >
            <option value="all">All Categories</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.slug}>
                {cat.name}
              </option>
            ))}
          </Select>
        </div>

        {/* Availability Filter */}
        <div className="w-full md:w-44">
          <Select
            value={selectedAvailability}
            onChange={(e) => setSelectedAvailability(e.target.value)}
          >
            <option value="all">All Statuses</option>
            <option value="available">In Stock Only</option>
            <option value="soldout">Sold Out Only</option>
          </Select>
        </div>
      </div>

      {/* Main Content Area: Table / Cards */}
      {isLoading ? (
        <TableSkeleton rows={6} />
      ) : filteredItems.length === 0 ? (
        <EmptyState
          icon={Coffee}
          title={searchQuery || selectedCategory !== "all" || selectedAvailability !== "all" ? "No matching menu items" : "No menu items yet"}
          description={
            searchQuery || selectedCategory !== "all" || selectedAvailability !== "all"
              ? "Try resetting your search filters to view other items."
              : "Get started by adding your first delicious cafe beverage or bake."
          }
          actionLabel={searchQuery || selectedCategory !== "all" || selectedAvailability !== "all" ? "Reset Filters" : "Add Menu Item"}
          onAction={() => {
            if (searchQuery || selectedCategory !== "all" || selectedAvailability !== "all") {
              setSearchQuery("");
              setSelectedCategory("all");
              setSelectedAvailability("all");
            } else {
              openAddModal();
            }
          }}
        />
      ) : (
        <>
          {/* Desktop Table View (Hidden on mobile) */}
          <div className="hidden lg:block bg-white/90 rounded-2xl border border-espresso/10 shadow-warm overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-espresso/10 bg-cream-light/60 text-[11px] font-bold uppercase tracking-wider text-espresso/70">
                  <th className="py-3.5 pl-6 pr-3">Item</th>
                  <th className="py-3.5 px-3">Category</th>
                  <th className="py-3.5 px-3">Price</th>
                  <th className="py-3.5 px-3">Diet</th>
                  <th className="py-3.5 px-3 text-center">In Stock</th>
                  <th className="py-3.5 px-3 text-center">Popular</th>
                  <th className="py-3.5 pl-3 pr-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-espresso/5 text-sm">
                {filteredItems.map((item) => (
                  <tr
                    key={item.id}
                    className="hover:bg-cream-light/30 transition-colors group"
                  >
                    {/* Item Thumbnail & Name */}
                    <td className="py-4 pl-6 pr-3">
                      <div className="flex items-center gap-3.5">
                        <img
                          src={item.imageUrl}
                          alt={item.name}
                          onError={(e) => {
                            e.currentTarget.onerror = null;
                            e.currentTarget.src = "https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=600&q=80";
                          }}
                          className="w-12 h-12 rounded-xl object-cover border border-espresso/10 flex-shrink-0"
                        />
                        <div className="max-w-xs">
                          <div className="font-semibold text-espresso">
                            {item.name}
                          </div>
                          {item.description && (
                            <p className="text-xs text-espresso/60 line-clamp-1 mt-0.5">
                              {item.description}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Category */}
                    <td className="py-4 px-3">
                      <Badge variant="default" size="sm" className="capitalize">
                        {item.category}
                      </Badge>
                    </td>

                    {/* Price */}
                    <td className="py-4 px-3 font-semibold text-terracotta tabular-nums">
                      ₹{item.price}
                    </td>

                    {/* Diet */}
                    <td className="py-4 px-3">
                      <VegIndicator isVeg={item.isVeg} showText size="sm" />
                    </td>

                    {/* Available Toggle */}
                    <td className="py-4 px-3 text-center">
                      <button
                        type="button"
                        onClick={() => toggleAvailability(item.id)}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold transition-colors ${
                          item.available
                            ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-200"
                            : "bg-red-100 text-red-800 hover:bg-red-200"
                        }`}
                        title="Click to toggle availability"
                      >
                        {item.available ? (
                          <>
                            <CheckCircle className="w-3.5 h-3.5" /> In Stock
                          </>
                        ) : (
                          <>
                            <XCircle className="w-3.5 h-3.5" /> Sold Out
                          </>
                        )}
                      </button>
                    </td>

                    {/* Popular Toggle */}
                    <td className="py-4 px-3 text-center">
                      <button
                        type="button"
                        onClick={() => togglePopular(item.id)}
                        className={`p-1.5 rounded-lg transition-colors ${
                          item.isPopular
                            ? "text-terracotta bg-terracotta/10 hover:bg-terracotta/20"
                            : "text-espresso/30 hover:text-espresso/70 hover:bg-espresso/5"
                        }`}
                        title={item.isPopular ? "Featured as popular" : "Mark as popular"}
                      >
                        <Sparkles className="w-4 h-4" />
                      </button>
                    </td>

                    {/* Actions */}
                    <td className="py-4 pl-3 pr-6 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => openEditModal(item)}
                          className="p-1.5 rounded-lg text-espresso/70 hover:text-espresso hover:bg-espresso/10 transition-colors"
                          title="Edit item"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteTarget(item)}
                          className="p-1.5 rounded-lg text-red-600 hover:bg-red-50 transition-colors"
                          title="Delete item"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Card View (Visible on mobile/tablet < 1024px) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 lg:hidden">
            {filteredItems.map((item) => (
              <div
                key={item.id}
                className="bg-white/90 p-4 rounded-2xl border border-espresso/10 shadow-warm space-y-3.5"
              >
                <div className="flex items-start gap-3">
                  <img
                    src={item.imageUrl}
                    alt={item.name}
                    onError={(e) => {
                      e.currentTarget.onerror = null;
                      e.currentTarget.src = "https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=600&q=80";
                    }}
                    className="w-16 h-16 rounded-xl object-cover border border-espresso/10 flex-shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <VegIndicator isVeg={item.isVeg} size="sm" />
                      <h3 className="font-semibold text-espresso truncate text-base">
                        {item.name}
                      </h3>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-sm font-bold text-terracotta tabular-nums">
                        ₹{item.price}
                      </span>
                      <Badge variant="default" size="sm" className="capitalize">
                        {item.category}
                      </Badge>
                    </div>
                    {item.description && (
                      <p className="text-xs text-espresso/60 line-clamp-2 mt-1">
                        {item.description}
                      </p>
                    )}
                  </div>
                </div>

                {/* Toggles & Actions */}
                <div className="pt-2 border-t border-espresso/10 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => toggleAvailability(item.id)}
                      className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                        item.available
                          ? "bg-emerald-100 text-emerald-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {item.available ? "In Stock" : "Sold Out"}
                    </button>
                    <button
                      type="button"
                      onClick={() => togglePopular(item.id)}
                      className={`p-1.5 rounded-lg ${
                        item.isPopular
                          ? "text-terracotta bg-terracotta/10"
                          : "text-espresso/30"
                      }`}
                      title="Popular"
                    >
                      <Sparkles className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="flex items-center gap-1">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openEditModal(item)}
                      leftIcon={<Edit2 className="w-3.5 h-3.5" />}
                    >
                      Edit
                    </Button>
                    <button
                      type="button"
                      onClick={() => setDeleteTarget(item)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      aria-label="Delete item"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Add / Edit Item Modal */}
      <Modal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        title={editingItem ? "Edit Menu Item" : "Add New Menu Item"}
        subtitle="Fill in the details below to update your cafe menu."
        maxWidth="max-w-xl"
      >
        <form onSubmit={handleFormSubmit} className="space-y-4">
          <Input
            label="Item Name"
            value={formValues.name}
            onChange={(e) =>
              setFormValues((prev) => ({ ...prev, name: e.target.value }))
            }
            placeholder="e.g. Lavender Honey Cold Brew"
            error={formErrors.name}
            required
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {categories.length === 0 ? (
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-espresso/70">Category *</label>
                <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 flex flex-col gap-1">
                  <span>No categories created yet.</span>
                  <Link
                    to="/categories"
                    onClick={() => setIsFormOpen(false)}
                    className="font-bold underline text-terracotta hover:text-terracotta-dark"
                  >
                    Create a category first &rarr;
                  </Link>
                </div>
              </div>
            ) : (
              <Select
                label="Category"
                value={formValues.category}
                onChange={(e) =>
                  setFormValues((prev) => ({ ...prev, category: e.target.value }))
                }
                error={formErrors.category}
                required
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.slug}>
                    {c.name}
                  </option>
                ))}
              </Select>
            )}

            <Input
              label="Price (₹ INR)"
              type="number"
              min="1"
              step="1"
              value={formValues.price}
              onChange={(e) =>
                setFormValues((prev) => ({ ...prev, price: e.target.value }))
              }
              placeholder="e.g. 240"
              error={formErrors.price}
              required
            />
          </div>

          <Textarea
            label="Description"
            rows={2}
            value={formValues.description}
            onChange={(e) =>
              setFormValues((prev) => ({
                ...prev,
                description: e.target.value
              }))
            }
            placeholder="A short, appetizing description of ingredients and flavors..."
          />

          {/* Image URL & Live Preview */}
          {/*
            TODO (Storage Phase): When Firebase Storage is enabled:
            1. Initialize storage via getStorage(app) in src/lib/firebase.js
            2. Add an optional <input type="file" accept="image/*" /> field below
            3. Upload file to ref(storage, `menu/${Date.now()}_${file.name}`) via uploadBytes
            4. Obtain download URL with getDownloadURL() and set formValues.imageUrl
          */}
          <div className="space-y-2">
            <Input
              label="Image URL"
              value={formValues.imageUrl}
              onChange={(e) =>
                setFormValues((prev) => ({ ...prev, imageUrl: e.target.value }))
              }
              placeholder="https://images.unsplash.com/..."
              helperText="Paste any direct image link or Unsplash photo URL"
            />
            {formValues.imageUrl && (
              <div className="flex items-center gap-3 p-3 rounded-xl bg-cream-light border border-espresso/10">
                <img
                  src={formValues.imageUrl}
                  alt="Preview"
                  className="w-14 h-14 rounded-lg object-cover border border-espresso/10 flex-shrink-0"
                  onError={(e) => {
                    e.target.src =
                      "https://images.unsplash.com/photo-1509785307050-d4066910ec1e?auto=format&fit=crop&w=600&q=80";
                  }}
                />
                <div className="text-xs text-espresso/70">
                  <span className="font-semibold block text-espresso">
                    Image Preview
                  </span>
                  Looks great! Will be displayed on menu cards.
                </div>
              </div>
            )}
          </div>

          {/* Feature Toggles */}
          <div className="pt-3 border-t border-espresso/10 space-y-3">
            <ToggleSwitch
              label="Vegetarian Option"
              description="Mark with the green vegetarian indicator"
              checked={formValues.isVeg}
              onChange={(val) =>
                setFormValues((prev) => ({ ...prev, isVeg: val }))
              }
            />

            <ToggleSwitch
              label="Feature as Popular"
              description="Highlight on homepage popular showcase"
              checked={formValues.isPopular}
              onChange={(val) =>
                setFormValues((prev) => ({ ...prev, isPopular: val }))
              }
            />

            <ToggleSwitch
              label="Item Available in Stock"
              description="Uncheck to mark as sold out on the public menu"
              checked={formValues.available}
              onChange={(val) =>
                setFormValues((prev) => ({ ...prev, available: val }))
              }
            />
          </div>

          {/* Modal Actions */}
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
              {editingItem ? "Save Changes" : "Create Item"}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDeleteConfirm}
        title="Delete Menu Item"
        message={`Are you sure you want to permanently remove "${deleteTarget?.name}" from the menu?`}
        confirmLabel="Delete Item"
        variant="danger"
        isLoading={isDeleting}
      />
    </div>
  );
};
