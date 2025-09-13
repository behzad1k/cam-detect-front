import React, { useState, useRef, useEffect } from 'react';

interface MultiSelectProps {
  options: string[];
  selected: string[];
  onChange: (selected: string[]) => void;
  placeholder?: string;
  disabled?: boolean;
  maxHeight?: string;
}

export const MultiSelect: React.FC<MultiSelectProps> = ({
                                                          options,
                                                          selected,
                                                          onChange,
                                                          placeholder = 'Select options...',
                                                          disabled = false,
                                                          maxHeight = '200px'
                                                        }) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleOption = (option: string) => {
    const newSelected = selected.includes(option)
      ? selected.filter(item => item !== option)
      : [...selected, option];
    onChange(newSelected);
  };

  const selectAll = () => {
    onChange([...options]);
  };

  const clearAll = () => {
    onChange([]);
  };

  return (
    <div ref={containerRef} style={{ position: 'relative', width: '100%' }}>
      <div
        onClick={() => !disabled && setIsOpen(!isOpen)}
        style={{
          border: '1px solid #ccc',
          borderRadius: '4px',
          padding: '8px 12px',
          backgroundColor: disabled ? '#f5f5f5' : 'white',
          cursor: disabled ? 'not-allowed' : 'pointer',
          minHeight: '36px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}
      >
        <div style={{ flex: 1 }}>
          {selected.length === 0 ? (
            <span style={{ color: '#999' }}>{placeholder}</span>
          ) : (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
              {selected.map(item => (
                <span
                  key={item}
                  style={{
                    backgroundColor: '#e3f2fd',
                    padding: '2px 6px',
                    borderRadius: '12px',
                    fontSize: '12px',
                    color: '#1976d2'
                  }}
                >
                  {item}
                </span>
              ))}
            </div>
          )}
        </div>
        <span style={{ marginLeft: '8px', color: '#666' }}>
          {isOpen ? '▲' : '▼'}
        </span>
      </div>

      {isOpen && (
        <div style={{
          position: 'absolute',
          top: '100%',
          left: 0,
          right: 0,
          backgroundColor: 'white',
          border: '1px solid #ccc',
          borderRadius: '4px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          zIndex: 1000,
          maxHeight,
          overflowY: 'auto'
        }}>
          {options.length > 0 && (
            <div style={{
              padding: '8px',
              borderBottom: '1px solid #eee',
              display: 'flex',
              gap: '8px'
            }}>
              <button
                onClick={selectAll}
                style={{
                  padding: '4px 8px',
                  fontSize: '12px',
                  backgroundColor: '#4caf50',
                  color: 'white',
                  border: 'none',
                  borderRadius: '3px',
                  cursor: 'pointer'
                }}
              >
                Select All
              </button>
              <button
                onClick={clearAll}
                style={{
                  padding: '4px 8px',
                  fontSize: '12px',
                  backgroundColor: '#f44336',
                  color: 'white',
                  border: 'none',
                  borderRadius: '3px',
                  cursor: 'pointer'
                }}
              >
                Clear All
              </button>
            </div>
          )}

          {options.length === 0 ? (
            <div style={{ padding: '12px', color: '#999', textAlign: 'center' }}>
              No options available
            </div>
          ) : (
            options.map(option => (
              <div
                key={option}
                onClick={() => toggleOption(option)}
                style={{
                  padding: '8px 12px',
                  cursor: 'pointer',
                  backgroundColor: selected.includes(option) ? '#e3f2fd' : 'transparent',
                  display: 'flex',
                  alignItems: 'center',
                  fontSize: '14px'
                }}
                onMouseEnter={(e) => {
                  if (!selected.includes(option)) {
                    e.currentTarget.style.backgroundColor = '#f5f5f5';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!selected.includes(option)) {
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }
                }}
              >
                <input
                  type="checkbox"
                  checked={selected.includes(option)}
                  onChange={() => {}} // Handled by parent onClick
                  style={{ marginRight: '8px' }}
                />
                {option}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};
