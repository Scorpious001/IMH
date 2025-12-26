import React, { useState, useEffect } from 'react';
import { settingsService } from '../../services/settingsService';
import { itemsService } from '../../services/itemsService';
import { Category } from '../../types/item.types';
import { Item } from '../../types/item.types';
import CategoryTile from './CategoryTile';
import './CategoryView.css';

interface CategoryViewProps {
  onCategorySelect: (categoryId: number) => void;
}

const CategoryView: React.FC<CategoryViewProps> = ({ onCategorySelect }) => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoryStats, setCategoryStats] = useState<Map<number, { totalItems: number; lowCountItems: number }>>(new Map());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCategoriesAndStats();
  }, []);

  const loadCategoriesAndStats = async () => {
    try {
      setLoading(true);
      const categoriesData = await settingsService.getCategories();

      // Filter to only top-level categories (no parent)
      const topLevelCategories = categoriesData.filter((cat) => !cat.parent_category);
      setCategories(topLevelCategories);

      // Calculate statistics for each category
      // Total Items: Count of all items listed in that category
      // Low Count: Count of items in that category that are below par
      // Query items by category (same way as when category is selected) to get accurate count
      const stats = new Map<number, { totalItems: number; lowCountItems: number }>();

      // Load items for each category to get accurate counts
      // This matches how items are loaded when a category is selected
      for (const category of categoriesData) {
        try {
          // Query items filtered by this category (same as when user clicks category)
          const categoryItems = await itemsService.getAll({ category: category.id });
          
          // Total items count - number of items listed in this category
          const totalItems = categoryItems.length;
          
          // Low count - items in this category that are below par at any location
          const lowCountItems = categoryItems.filter(
            (item) => item.is_below_par_anywhere === true
          ).length;

          stats.set(category.id, { totalItems, lowCountItems });
        } catch (error) {
          console.error(`Error loading items for category ${category.id}:`, error);
          stats.set(category.id, { totalItems: 0, lowCountItems: 0 });
        }
      }

      setCategoryStats(stats);
    } catch (error) {
      console.error('Error loading categories:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="category-view-loading">Loading categories...</div>;
  }

  return (
    <div className="category-view">
      {categories.length === 0 ? (
        <div className="empty-categories">
          <p>No categories found</p>
        </div>
      ) : (
        <div className="category-list">
          {categories.map((category) => {
            const stats = categoryStats.get(category.id) || { totalItems: 0, lowCountItems: 0 };
            return (
              <CategoryTile
                key={category.id}
                category={category}
                totalItems={stats.totalItems}
                lowCountItems={stats.lowCountItems}
                onClick={() => onCategorySelect(category.id)}
              />
            );
          })}
        </div>
      )}
    </div>
  );
};

export default CategoryView;

