import React from 'react';
import { Coffee, CupSoda, Flame, Sparkles, Utensils, Cake, Layers } from 'lucide-react';

const categoryIcons = {
  all: Layers,
  coffee: Coffee,
  tea: Flame,
  'cold-drinks': CupSoda,
  snacks: Utensils,
  desserts: Cake,
};

export function CategoryBar({ categories = [], activeCategory = 'all', onSelectCategory }) {
  // Ensure "All Items" option is always available as the first chip
  const hasAllOption = categories.some((cat) => (cat.slug === 'all' || cat.id === 'all'));
  const allCategories = hasAllOption
    ? categories
    : [{ id: 'all', slug: 'all', name: 'All Items' }, ...categories];

  return (
    <div className="sticky top-[69px] z-30 bg-cream-100/95 backdrop-blur-md border-b border-espresso-200/60 py-3 shadow-warm-sm">
      <div className="max-w-content mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar scroll-smooth py-1 -my-1">
          {allCategories.map((cat) => {
            const catKey = cat.slug || cat.id;
            const Icon = categoryIcons[catKey] || categoryIcons[cat.id] || Sparkles;
            const isActive =
              activeCategory === catKey ||
              activeCategory === cat.id ||
              (activeCategory === 'all' && (catKey === 'all' || cat.id === 'all'));

            return (
              <button
                key={cat.id || catKey}
                type="button"
                onClick={() => onSelectCategory(catKey)}
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs sm:text-sm font-medium transition-all duration-200 whitespace-nowrap shrink-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-terracotta-500 ${
                  isActive
                    ? 'bg-espresso-800 text-cream-50 shadow-warm-sm scale-[1.02]'
                    : 'bg-white hover:bg-cream-50 text-espresso-700 border border-espresso-200/80 hover:border-espresso-300'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-terracotta-300' : 'text-espresso-500'}`} />
                <span>{cat.name}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
