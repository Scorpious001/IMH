import React, { useState, useEffect } from 'react';
import { settingsService } from '../../services/settingsService';
import { Category } from '../../types/item.types';
import CategoryForm from './CategoryForm';
import './CategoriesTab.css';

const CategoriesTab: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      setLoading(true);
      const data = await settingsService.getCategories();
      setCategories(data);
    } catch (error) {
      console.error('Error loading categories:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    setEditingCategory(null);
    setShowForm(true);
  };

  const handleEdit = (category: Category) => {
    setEditingCategory(category);
    setShowForm(true);
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this category?')) {
      try {
        await settingsService.deleteCategory(id);
        loadCategories();
      } catch (error) {
        console.error('Error deleting category:', error);
        alert('Failed to delete category');
      }
    }
  };

  const handleFormSubmit = () => {
    setShowForm(false);
    setEditingCategory(null);
    loadCategories();
  };

  const topLevelCategories = categories.filter((cat) => !cat.parent_category);

  if (loading) {
    return <div className="tab-loading">Loading categories...</div>;
  }

  return (
    <div className="categories-tab">
      <div className="tab-header">
        <h2>Categories</h2>
        <button className="btn-primary" onClick={handleAdd}>
          Add Category
        </button>
      </div>

      {showForm && (
        <div className="form-modal">
          <CategoryForm
            category={editingCategory}
            categories={categories}
            onSubmit={handleFormSubmit}
            onCancel={() => {
              setShowForm(false);
              setEditingCategory(null);
            }}
          />
        </div>
      )}

      <div className="categories-list">
        {topLevelCategories.length === 0 ? (
          <div className="empty-state">
            <p>No categories found</p>
            <button className="btn-primary" onClick={handleAdd}>
              Create First Category
            </button>
          </div>
        ) : (
          topLevelCategories.map((category) => (
            <CategoryItem
              key={category.id}
              category={category}
              allCategories={categories}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          ))
        )}
      </div>
    </div>
  );
};

interface CategoryItemProps {
  category: Category;
  allCategories: Category[];
  onEdit: (category: Category) => void;
  onDelete: (id: number) => void;
}

const CategoryItem: React.FC<CategoryItemProps> = ({
  category,
  allCategories,
  onEdit,
  onDelete,
}) => {
  const subcategories = allCategories.filter((cat) => cat.parent_category === category.id);

  return (
    <div className="category-item">
      <div className="category-header">
        <div className="category-info">
          {category.icon && <span className="category-icon">{category.icon}</span>}
          <span className="category-name">{category.name}</span>
          {!category.is_active && (
            <span className="category-inactive">(Inactive)</span>
          )}
        </div>
        <div className="category-actions">
          <button className="btn-small btn-primary" onClick={() => onEdit(category)}>
            Edit
          </button>
          <button className="btn-small btn-danger" onClick={() => onDelete(category.id)}>
            Delete
          </button>
        </div>
      </div>
      {subcategories.length > 0 && (
        <div className="subcategories">
          {subcategories.map((sub) => (
            <div key={sub.id} className="subcategory-item">
              <span className="subcategory-indent">└─</span>
              <span className="subcategory-name">{sub.name}</span>
              {!sub.is_active && <span className="category-inactive">(Inactive)</span>}
              <div className="subcategory-actions">
                <button className="btn-small btn-primary" onClick={() => onEdit(sub)}>
                  Edit
                </button>
                <button className="btn-small btn-danger" onClick={() => onDelete(sub.id)}>
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CategoriesTab;

