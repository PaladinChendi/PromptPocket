// src/popup/components/PromptEditor.tsx

import React, { useState, useEffect } from 'react';
import { PromptTemplate, Category, VariableDefinition } from '../../types';

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
  const [autoSubmit, setAutoSubmit] = useState(prompt?.autoSubmit || false);
  const [variables, setVariables] = useState<VariableDefinition[]>(prompt?.variables || []);
  const [isSaving, setIsSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Extract variables from content
  const extractVariables = (text: string): string[] => {
    const regex = /\{\{(\w+)\}\}/g;
    const matches = text.matchAll(regex);
    const vars = new Set<string>();

    for (const match of matches) {
      vars.add(match[1]);
    }

    return Array.from(vars);
  };

  // Update variables when content changes
  useEffect(() => {
    const extractedVars = extractVariables(content);
    const currentVarNames = variables.map(v => v.name);

    // Add new variables
    extractedVars.forEach(varName => {
      if (!currentVarNames.includes(varName)) {
        setVariables(prev => [
          ...prev,
          {
            name: varName,
            label: varName.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
            defaultValue: '',
            required: false,
            type: 'text'
          }
        ]);
      }
    });

    // Remove variables that no longer exist
    setVariables(prev => prev.filter(v => extractedVars.includes(v.name)));
  }, [content]);

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
        tags: tags.split(',').map(t => t.trim()).filter(t => t.length > 0),
        autoSubmit,
        variables: variables.length > 0 ? variables : undefined
      };

      await onSave(promptData, prompt?.id);
    } catch (error) {
      console.error('Failed to save prompt:', error);
      alert('Failed to save prompt. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const updateVariable = (index: number, updates: Partial<VariableDefinition>) => {
    setVariables(prev => {
      const newVars = [...prev];
      newVars[index] = { ...newVars[index], ...updates };
      return newVars;
    });
  };

  const removeVariable = (index: number) => {
    setVariables(prev => prev.filter((_, i) => i !== index));
  };

  const addVariable = () => {
    setVariables(prev => [
      ...prev,
      {
        name: `variable_${Date.now()}`,
        label: 'New Variable',
        defaultValue: '',
        required: false,
        type: 'text'
      }
    ]);
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
              placeholder="Enter your prompt template. Use {{variable}} for variables."
              rows={8}
              disabled={isSaving}
            />
            {errors.content && (
              <div style={{ fontSize: '12px', color: '#dc3545', marginTop: '4px' }}>
                {errors.content}
              </div>
            )}
            <div style={{ fontSize: '11px', color: '#6c757d', marginTop: '4px' }}>
              Use <code>{'{{variable_name}}'}</code> for variables
            </div>
          </div>

          {/* Variables Section */}
          {variables.length > 0 && (
            <div className="form-group">
              <label className="form-label">Variables</label>
              <div style={{ border: '1px solid #e9ecef', borderRadius: '6px', padding: '12px' }}>
                {variables.map((variable, index) => (
                  <div key={index} style={{ marginBottom: '12px', paddingBottom: '12px', borderBottom: '1px solid #f8f9fa' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <div style={{ fontSize: '13px', fontWeight: 500 }}>
                        {variable.label} (<code>{'{{' + variable.name + '}}'}</code>)
                      </div>
                      <button
                        type="button"
                        className="btn-icon"
                        onClick={() => removeVariable(index)}
                        disabled={isSaving}
                      >
                        🗑️
                      </button>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                      <div>
                        <label style={{ fontSize: '11px', display: 'block', marginBottom: '4px' }}>
                          Label
                        </label>
                        <input
                          type="text"
                          value={variable.label}
                          onChange={(e) => updateVariable(index, { label: e.target.value })}
                          className="form-input"
                          disabled={isSaving}
                          style={{ fontSize: '12px', padding: '6px 8px' }}
                        />
                      </div>

                      <div>
                        <label style={{ fontSize: '11px', display: 'block', marginBottom: '4px' }}>
                          Type
                        </label>
                        <select
                          value={variable.type || 'text'}
                          onChange={(e) => updateVariable(index, { type: e.target.value as any })}
                          className="form-select"
                          disabled={isSaving}
                          style={{ fontSize: '12px', padding: '6px 8px' }}
                        >
                          <option value="text">Text</option>
                          <option value="number">Number</option>
                          <option value="select">Select</option>
                        </select>
                      </div>
                    </div>

                    <div style={{ marginTop: '8px' }}>
                      <label style={{ fontSize: '11px', display: 'block', marginBottom: '4px' }}>
                        Default Value
                      </label>
                      <input
                        type="text"
                        value={variable.defaultValue || ''}
                        onChange={(e) => updateVariable(index, { defaultValue: e.target.value })}
                        className="form-input"
                        disabled={isSaving}
                        style={{ fontSize: '12px', padding: '6px 8px' }}
                      />
                    </div>

                    <div style={{ marginTop: '8px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <label style={{ fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <input
                          type="checkbox"
                          checked={variable.required || false}
                          onChange={(e) => updateVariable(index, { required: e.target.checked })}
                          disabled={isSaving}
                        />
                        Required
                      </label>
                    </div>
                  </div>
                ))}

                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={addVariable}
                  disabled={isSaving}
                  style={{ fontSize: '12px', padding: '6px 12px' }}
                >
                  + Add Variable
                </button>
              </div>
            </div>
          )}

          {/* Auto Submit */}
          <div className="form-group">
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <input
                type="checkbox"
                checked={autoSubmit}
                onChange={(e) => setAutoSubmit(e.target.checked)}
                disabled={isSaving}
              />
              <span style={{ fontSize: '13px' }}>Auto-submit after insertion</span>
            </label>
            <div style={{ fontSize: '11px', color: '#6c757d', marginTop: '4px' }}>
              Automatically submit the prompt after inserting it into ChatGPT
            </div>
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