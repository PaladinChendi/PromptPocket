// src/popup/components/PromptList.tsx

import React, { useState, useMemo } from 'react';
import { PromptTemplate, Category } from '../../types';
import FilterDropdown from './FilterDropdown';

interface PromptListProps {
  prompts: Record<string, PromptTemplate>;
  categories: Record<string, Category>;
  onExecute: (id: string) => void;
  onEdit: (prompt: PromptTemplate) => void;
  onDelete: (id: string) => void;
}

const PromptList: React.FC<PromptListProps> = ({
  prompts,
  categories,
  onExecute,
  onEdit,
  onDelete
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'title' | 'usage' | 'updated'>('updated');

  // Get sorted and filtered prompts
  const filteredPrompts = useMemo(() => {
    let filtered = Object.values(prompts);

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(prompt =>
        prompt.title.toLowerCase().includes(query) ||
        prompt.description?.toLowerCase().includes(query) ||
        prompt.tags.some(tag => tag.toLowerCase().includes(query))
      );
    }

    // Filter by category
    if (selectedCategory !== 'all') {
      if (selectedCategory === 'uncategorized') {
        // Uncategorized = prompts with no category set
        filtered = filtered.filter(prompt => !prompt.category);
      } else {
        filtered = filtered.filter(prompt => prompt.category === selectedCategory);
      }
    }

    // Sort prompts
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'title':
          return a.title.localeCompare(b.title);
        case 'usage':
          return b.usageCount - a.usageCount;
        case 'updated':
        default:
          return b.updatedAt - a.updatedAt;
      }
    });

    return filtered;
  }, [prompts, searchQuery, selectedCategory, sortBy]);

  // Get category options (FilterOption shape: value/label)
  const categoryOptions = useMemo(() => {
    const options = [
      { value: 'all', label: `All Categories (${Object.keys(prompts).length})` }
    ];

    Object.values(categories).forEach(category => {
      const count = Object.values(prompts).filter(p => p.category === category.id).length;
      options.push({ value: category.id, label: `${category.name} (${count})` });
    });

    // Add uncategorized
    const uncategorizedCount = Object.values(prompts).filter(p => !p.category).length;
    options.push({ value: 'uncategorized', label: `Uncategorized (${uncategorizedCount})` });

    return options;
  }, [prompts, categories]);

  // Sort options (FilterOption shape)
  const sortOptions = useMemo(
    () => [
      { value: 'updated', label: 'Recently Updated' },
      { value: 'title', label: 'Title A-Z' },
      { value: 'usage', label: 'Most Used' }
    ],
    []
  );

  // Get category name
  const getCategoryName = (categoryId?: string) => {
    if (!categoryId) return 'Uncategorized';
    return categories[categoryId]?.name || categoryId;
  };

  // Get category color
  const getCategoryColor = (categoryId?: string) => {
    if (!categoryId) return '#6c757d';
    return categories[categoryId]?.color || '#667eea';
  };

  if (Object.keys(prompts).length === 0) {
    return (
      <div className="empty-state">
        <div className="empty-state-icon">📝</div>
        <div className="empty-state-title">No prompts yet</div>
        <div className="empty-state-description">
          Create your first prompt template to get started
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Filters */}
      <div className="filter-bar">
        <div className="filter-search-wrap">
          <input
            type="text"
            placeholder="Search prompts..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="form-input"
          />
        </div>

        <FilterDropdown
          icon="☰"
          label="Category"
          value={selectedCategory}
          options={categoryOptions}
          onChange={(v) => setSelectedCategory(v)}
        />

        <FilterDropdown
          icon="⇅"
          label="Sort"
          value={sortBy}
          options={sortOptions}
          onChange={(v) => setSortBy(v as 'title' | 'usage' | 'updated')}
        />
      </div>

      {/* Results count */}
      <div style={{ fontSize: '12px', color: '#6c757d', marginBottom: '12px' }}>
        {filteredPrompts.length} prompt{filteredPrompts.length !== 1 ? 's' : ''} found
      </div>

      {/* Prompt list */}
      <div className="prompt-list">
        {filteredPrompts.map(prompt => (
          <div key={prompt.id} className="prompt-item" onClick={() => onExecute(prompt.id)}>
            <div className="prompt-item-header">
              <h3 className="prompt-item-title">{prompt.title}</h3>
              <div className="prompt-item-actions">
                <button
                  className="btn-icon"
                  onClick={(e) => {
                    e.stopPropagation();
                    onEdit(prompt);
                  }}
                  title="Edit"
                >
                  ✏️
                </button>
                <button
                  className="btn-icon"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(prompt.id);
                  }}
                  title="Delete"
                >
                  🗑️
                </button>
              </div>
            </div>

            {prompt.description && (
              <p className="prompt-item-description">{prompt.description}</p>
            )}

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span
                  style={{
                    fontSize: '10px',
                    padding: '2px 6px',
                    borderRadius: '10px',
                    background: getCategoryColor(prompt.category),
                    color: 'white'
                  }}
                >
                  {getCategoryName(prompt.category)}
                </span>

                {prompt.tags.length > 0 && (
                  <div className="prompt-item-tags">
                    {prompt.tags.slice(0, 3).map(tag => (
                      <span key={tag} className="tag">{tag}</span>
                    ))}
                    {prompt.tags.length > 3 && (
                      <span className="tag">+{prompt.tags.length - 3}</span>
                    )}
                  </div>
                )}
              </div>

              <div style={{ fontSize: '11px', color: '#6c757d', display: 'flex', gap: '8px' }}>
                <span>Used {prompt.usageCount}×</span>
                <span>•</span>
                <span title={new Date(prompt.updatedAt).toLocaleString()}>
                  {formatDate(prompt.updatedAt)}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </>
  );
};

// Helper function to format date
function formatDate(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;

  const minute = 60 * 1000;
  const hour = 60 * minute;
  const day = 24 * hour;
  const week = 7 * day;

  if (diff < minute) return 'Just now';
  if (diff < hour) return `${Math.floor(diff / minute)}m ago`;
  if (diff < day) return `${Math.floor(diff / hour)}h ago`;
  if (diff < week) return `${Math.floor(diff / day)}d ago`;

  return new Date(timestamp).toLocaleDateString();
}

export default PromptList;