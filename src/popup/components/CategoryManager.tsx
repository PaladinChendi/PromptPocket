// src/popup/components/CategoryManager.tsx

import React, { useState } from 'react';
import { Category, PromptTemplate } from '../../types';
import { sendMessage, MessageBuilder } from '../../utils/messages';

interface CategoryManagerProps {
  categories: Record<string, Category>;
  prompts: Record<string, PromptTemplate>;
  onUpdate: () => void;
}

const CategoryManager: React.FC<CategoryManagerProps> = ({
  categories,
  prompts,
  onUpdate
}) => {
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryColor, setNewCategoryColor] = useState('#667eea');
  const [newCategoryDescription, setNewCategoryDescription] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const handleCreateCategory = async () => {
    if (!newCategoryName.trim()) return;

    setIsSaving(true);
    try {
      const category = {
        name: newCategoryName.trim(),
        color: newCategoryColor,
        description: newCategoryDescription.trim() || undefined
      };

      await sendMessage(MessageBuilder.saveCategory(category));

      // Reset form
      setNewCategoryName('');
      setNewCategoryColor('#667eea');
      setNewCategoryDescription('');

      // Refresh data
      onUpdate();
    } catch (error) {
      console.error('Failed to create category:', error);
      alert('Failed to create category');
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdateCategory = async () => {
    if (!editingCategory) return;

    setIsSaving(true);
    try {
      const category = {
        name: editingCategory.name,
        color: editingCategory.color,
        description: editingCategory.description
      };

      await sendMessage(MessageBuilder.saveCategory(category, editingCategory.id));
      setEditingCategory(null);
      onUpdate();
    } catch (error) {
      console.error('Failed to update category:', error);
      alert('Failed to update category');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteCategory = async (id: string) => {
    const category = categories[id];
    if (!category) return;

    // Count prompts in this category
    const promptCount = Object.values(prompts).filter(p => p.category === id).length;

    if (promptCount > 0) {
      const message = `This category contains ${promptCount} prompt(s).\n\n` +
        `Deleting it will remove the category from these prompts.\n` +
        `Do you want to continue?`;

      if (!confirm(message)) return;
    }

    if (confirm(`Are you sure you want to delete the category "${category.name}"?`)) {
      try {
        await sendMessage(MessageBuilder.deleteCategory(id));
        onUpdate();
      } catch (error) {
        console.error('Failed to delete category:', error);
        alert('Failed to delete category');
      }
    }
  };

  // Get color palette options
  const colorPalette = [
    '#667eea', '#764ba2', '#f56565', '#ed8936', '#ecc94b',
    '#48bb78', '#38b2ac', '#4299e1', '#9f7aea', '#ed64a6',
    '#4a5568', '#718096'
  ];

  return (
    <div>
      {/* Create Category Form */}
      <div style={{ background: '#f8f9fa', padding: '16px', borderRadius: '8px', marginBottom: '20px' }}>
        <h3 style={{ fontSize: '14px', marginBottom: '12px', color: '#495057' }}>Create New Category</h3>

        <div className="form-group">
          <label className="form-label">Category Name</label>
          <input
            type="text"
            value={newCategoryName}
            onChange={(e) => setNewCategoryName(e.target.value)}
            className="form-input"
            placeholder="Enter category name"
            disabled={isSaving}
          />
        </div>

        <div className="form-group">
          <label className="form-label">Description (Optional)</label>
          <input
            type="text"
            value={newCategoryDescription}
            onChange={(e) => setNewCategoryDescription(e.target.value)}
            className="form-input"
            placeholder="Brief description"
            disabled={isSaving}
          />
        </div>

        <div className="form-group">
          <label className="form-label">Color</label>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {colorPalette.map(color => (
              <button
                key={color}
                type="button"
                style={{
                  width: '24px',
                  height: '24px',
                  borderRadius: '50%',
                  background: color,
                  border: newCategoryColor === color ? '2px solid #495057' : '2px solid transparent',
                  cursor: 'pointer'
                }}
                onClick={() => setNewCategoryColor(color)}
                title={color}
              />
            ))}
          </div>
          <div style={{ fontSize: '11px', color: '#6c757d', marginTop: '8px' }}>
            Selected: <code>{newCategoryColor}</code>
          </div>
        </div>

        <button
          className="btn btn-primary"
          onClick={handleCreateCategory}
          disabled={isSaving || !newCategoryName.trim()}
          style={{ width: '100%' }}
        >
          {isSaving ? 'Creating...' : 'Create Category'}
        </button>
      </div>

      {/* Category List */}
      <h3 style={{ fontSize: '14px', marginBottom: '12px', color: '#495057' }}>Your Categories</h3>

      {Object.keys(categories).length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">🏷️</div>
          <div className="empty-state-title">No categories yet</div>
          <div className="empty-state-description">
            Create categories to organize your prompts
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {Object.values(categories).map(category => {
            const promptCount = Object.values(prompts).filter(p => p.category === category.id).length;

            return (
              <div
                key={category.id}
                style={{
                  background: '#f8f9fa',
                  border: '1px solid #e9ecef',
                  borderRadius: '8px',
                  padding: '16px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div
                    style={{
                      width: '24px',
                      height: '24px',
                      borderRadius: '50%',
                      background: category.color || '#667eea'
                    }}
                  />
                  <div>
                    <div style={{ fontSize: '14px', fontWeight: 500, color: '#212529' }}>
                      {category.name}
                    </div>
                    {category.description && (
                      <div style={{ fontSize: '12px', color: '#6c757d', marginTop: '2px' }}>
                        {category.description}
                      </div>
                    )}
                    <div style={{ fontSize: '11px', color: '#6c757d', marginTop: '4px' }}>
                      {promptCount} prompt{promptCount !== 1 ? 's' : ''} • Created{' '}
                      {new Date(category.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    className="btn-icon"
                    onClick={() => setEditingCategory(category)}
                    disabled={isSaving}
                    title="Edit"
                  >
                    ✏️
                  </button>
                  <button
                    className="btn-icon"
                    onClick={() => handleDeleteCategory(category.id)}
                    disabled={isSaving}
                    title="Delete"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Edit Category Modal */}
      {editingCategory && (
        <div className="modal-overlay">
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Edit Category</h3>
              <button
                className="modal-close"
                onClick={() => setEditingCategory(null)}
                disabled={isSaving}
              >
                ×
              </button>
            </div>

            <div className="modal-content">
              <div className="form-group">
                <label className="form-label">Category Name</label>
                <input
                  type="text"
                  value={editingCategory.name}
                  onChange={(e) => setEditingCategory({
                    ...editingCategory,
                    name: e.target.value
                  })}
                  className="form-input"
                  disabled={isSaving}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Description</label>
                <input
                  type="text"
                  value={editingCategory.description || ''}
                  onChange={(e) => setEditingCategory({
                    ...editingCategory,
                    description: e.target.value
                  })}
                  className="form-input"
                  disabled={isSaving}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Color</label>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {colorPalette.map(color => (
                    <button
                      key={color}
                      type="button"
                      style={{
                        width: '24px',
                        height: '24px',
                        borderRadius: '50%',
                        background: color,
                        border: editingCategory.color === color ? '2px solid #495057' : '2px solid transparent',
                        cursor: 'pointer'
                      }}
                      onClick={() => setEditingCategory({
                        ...editingCategory,
                        color
                      })}
                      title={color}
                    />
                  ))}
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button
                className="btn btn-secondary"
                onClick={() => setEditingCategory(null)}
                disabled={isSaving}
              >
                Cancel
              </button>
              <button
                className="btn btn-primary"
                onClick={handleUpdateCategory}
                disabled={isSaving || !editingCategory.name.trim()}
              >
                {isSaving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CategoryManager;