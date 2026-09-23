// src/popup/components/VariableForm.tsx

import React, { useState } from 'react';
import { PromptTemplate } from '../../types';
import { extractVariables, substituteVariables } from '../../utils/variables';

interface VariableFormProps {
  prompt: PromptTemplate;
  onSubmit: (values: Record<string, string>) => Promise<void>;
  onCancel: () => void;
}

/**
 * Collects values for a prompt's `{{name}}` placeholders before insertion,
 * and previews the resolved text so the user can see what will be inserted.
 */
const VariableForm: React.FC<VariableFormProps> = ({ prompt, onSubmit, onCancel }) => {
  const names = extractVariables(prompt.content);
  const [values, setValues] = useState<Record<string, string>>(() =>
    Object.fromEntries(names.map(name => [name, '']))
  );
  const [isInserting, setIsInserting] = useState(false);

  const handleChange = (name: string, value: string) => {
    setValues(prev => ({ ...prev, [name]: value }));
  };

  const handleInsert = async () => {
    setIsInserting(true);
    try {
      await onSubmit(values);
    } finally {
      setIsInserting(false);
    }
  };

  // Submit on Ctrl/Cmd+Enter, the usual shortcut for "send this form".
  const handleKeyDown = (event: React.KeyboardEvent) => {
    if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
      event.preventDefault();
      handleInsert();
    }
  };

  const preview = substituteVariables(prompt.content, values);

  return (
    <div className="modal-overlay">
      <div className="modal" onClick={(e) => e.stopPropagation()} onKeyDown={handleKeyDown}>
        <div className="modal-header">
          <h3 className="modal-title">{prompt.title}</h3>
          <button className="modal-close" onClick={onCancel} disabled={isInserting}>
            ×
          </button>
        </div>

        <div className="modal-content">
          <div style={{ fontSize: '12px', color: 'var(--pp-text-muted)', marginBottom: '12px' }}>
            Fill in {names.length} variable{names.length !== 1 ? 's' : ''}, then insert.
            Blank values are inserted as empty text.
          </div>

          {names.map((name, index) => (
            <div className="form-group" key={name}>
              <label className="form-label">{name}</label>
              <input
                type="text"
                value={values[name]}
                onChange={(e) => handleChange(name, e.target.value)}
                className="form-input"
                placeholder={`Value for ${name}`}
                disabled={isInserting}
                autoFocus={index === 0}
              />
            </div>
          ))}

          <div className="form-group">
            <label className="form-label">Preview</label>
            <div className="variable-preview">{preview}</div>
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onCancel} disabled={isInserting}>
            Cancel
          </button>
          <button className="btn btn-primary" onClick={handleInsert} disabled={isInserting}>
            {isInserting ? 'Inserting...' : 'Insert'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default VariableForm;
