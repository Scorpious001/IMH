import React, { useState, useEffect } from 'react';
import { Category } from '../../types/item.types';
import { settingsService } from '../../services/settingsService';
import './CategoryForm.css';

interface CategoryFormProps {
  category?: Category | null;
  categories: Category[];
  onSubmit: () => void;
  onCancel: () => void;
}

const CategoryForm: React.FC<CategoryFormProps> = ({
  category,
  categories,
  onSubmit,
  onCancel,
}) => {
  const [formData, setFormData] = useState({
    name: '',
    icon: '',
    parent_category: null as number | null,
    is_active: true,
  });

  useEffect(() => {
    if (category) {
      setFormData({
        name: category.name,
        icon: category.icon || '',
        parent_category: category.parent_category || null,
        is_active: category.is_active,
      });
    }
  }, [category]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (category) {
        await settingsService.updateCategory(category.id, {
          name: formData.name,
          icon: formData.icon || undefined,
          parent_category: formData.parent_category ?? undefined,
          is_active: formData.is_active,
        });
      } else {
        const categoryData: any = {
          name: formData.name,
          is_active: formData.is_active,
        };
        
        // Only include parent_category if it has a value
        if (formData.parent_category !== null) {
          categoryData.parent_category = formData.parent_category;
        }
        
        // Only include icon if it has a value
        if (formData.icon) {
          categoryData.icon = formData.icon;
        }
        
        await settingsService.createCategory(categoryData);
      }
      onSubmit();
    } catch (error: any) {
      console.error('Error saving category:', error);
      console.error('Error response:', error?.response);
      console.error('Error data:', error?.response?.data);
      const errorMessage = error?.response?.data?.error || 
                          error?.response?.data?.detail || 
                          error?.response?.data?.message || 
                          (typeof error?.response?.data === 'string' ? error.response.data.substring(0, 200) : null) ||
                          (typeof error?.response?.data === 'object' ? JSON.stringify(error.response.data).substring(0, 200) : null) ||
                          error?.message || 
                          'Failed to save category';
      alert(`Failed to save category: ${errorMessage}`);
    }
  };

  // Filter out the current category and its subcategories from parent options
  const availableParents = categories.filter(
    (cat) => !category || (cat.id !== category.id && cat.parent_category !== category.id)
  );

  return (
    <form className="category-form" onSubmit={handleSubmit}>
      <div className="form-group">
        <label htmlFor="category-name">Name *</label>
        <input
          id="category-name"
          name="name"
          type="text"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          required
          autoFocus
        />
      </div>

      <div className="form-group">
        <label>Icon (optional)</label>
        <input
          type="text"
          value={formData.icon}
          onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
          placeholder="Icon name or class"
        />
      </div>

      <div className="form-group">
        <label>Parent Category (optional)</label>
        <select
          value={formData.parent_category || ''}
          onChange={(e) =>
            setFormData({ ...formData, parent_category: e.target.value ? Number(e.target.value) : null })
          }
        >
          <option value="">None (Top Level)</option>
          {availableParents.map((cat) => (
            <option key={cat.id} value={cat.id}>
              {cat.name}
            </option>
          ))}
        </select>
      </div>

      <div className="form-group">
        <label>
          <input
            type="checkbox"
            checked={formData.is_active}
            onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
          />
          Active
        </label>
      </div>

      <div className="form-actions">
        <button type="submit" className="btn-primary">
          {category ? 'Update' : 'Create'}
        </button>
        <button type="button" className="btn-secondary" onClick={onCancel}>
          Cancel
        </button>
      </div>
    </form>
  );
};

export default CategoryForm;

