// src/popup/components/PromptEditor.tsx

import React, { useState } from 'react';
import { PromptTemplate, Category } from '../../types';

interface PromptEditorProps {
  prompt?: PromptTemplate | null;
  categories: Record<string, Category>;
  onSave: (
    prompt: Omit<PromptTemplate, 'id' | 'createdAt' | 'updatedAt' | 'usageCount'>,
    id?: string
  ) => Promise<void>;
  onCancel: () => void;
}

const PromptEditor: React.FC<PromptEditorProps> = ({
  prompt,
  categories,
  onSave,
  onCancel
}) => {
  const [title, setTitle] = useState(prompt?.title || '');
  const [content, setContent] = useState(prompt?.content || '');
  const [description, setDescription] = useState(prompt?.description || '');
  const [category, setCategory] = useState(prompt?.category || '');
  const [tags, setTags] = useState(prompt?.tags.join(', ') || '');
  const [isSaving, setIsSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!title.trim()) {
      newErrors.title = 'Title is required';
    }

    if (!content.trim()) {
      newErrors.content = 'Content is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;

    setIsSaving(true);
    try {
      const promptData = {
        title: title.trim(),
        content: content.trim(),
        description: description.trim(),
        category: category || undefined,
        tags: tags.split(',').map(t => t.trim()).filter(t => t.length > 0)
      };

      await onSave(promptData, prompt?.id);
    } catch (error) {
      DEBUG && console.error('Failed to save prompt:', error);
      alert('Failed to save prompt. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const categoryOptions = Object.values(categories).map(cat => ({
    id: cat.id,
    name: cat.name
  }));

  return (
    <div className="modal-overlay">
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3 className="modal-title">
            {prompt ? 'Edit Prompt' : 'New Prompt'}
          </h3>
          <button className="modal-close" onClick={onCancel} disabled={isSaving}>
            ×
          </button>
        </div>

        <div className="modal-content">
          {/* Title */}
          <div className="form-group">
            <label className="form-label">Title *</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="form-input"
              placeholder="Enter prompt title"
              disabled={isSaving}
            />
            {errors.title && (
              <div style={{ fontSize: '12px', color: '#dc3545', marginTop: '4px' }}>
                {errors.title}
              </div>
            )}
          </div>

          {/* Description */}
          <div className="form-group">
            <label className="form-label">Description</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="form-input"
              placeholder="Optional description"
              disabled={isSaving}
            />
          </div>

          {/* Category */}
          <div className="form-group">
            <label className="form-label">Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="form-select"
              disabled={isSaving}
            >
              <option value="">Select a category</option>
              {categoryOptions.map(option => (
                <option key={option.id} value={option.id}>
                  {option.name}
                </option>
              ))}
            </select>
          </div>

          {/* Tags */}
          <div className="form-group">
            <label className="form-label">Tags</label>
            <input
              type="text"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              className="form-input"
              placeholder="comma, separated, tags"
              disabled={isSaving}
            />
            <div style={{ fontSize: '11px', color: '#6c757d', marginTop: '4px' }}>
              Separate tags with commas
            </div>
          </div>

          {/* Content */}
          <div className="form-group">
            <label className="form-label">Prompt Content *</label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="form-textarea"
              placeholder="Enter your prompt template."
              rows={8}
              disabled={isSaving}
            />
            {errors.content && (
              <div style={{ fontSize: '12px', color: '#dc3545', marginTop: '4px' }}>
                {errors.content}
              </div>
            )}
          </div>
        </div>

        <div className="modal-footer">
          <button
            className="btn btn-secondary"
            onClick={onCancel}
            disabled={isSaving}
          >
            Cancel
          </button>
          <button
            className="btn btn-primary"
            onClick={handleSave}
            disabled={isSaving}
          >
            {isSaving ? 'Saving...' : (prompt ? 'Update Prompt' : 'Save Prompt')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PromptEditor;