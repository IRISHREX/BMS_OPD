import React, { useState } from 'react';
import AutoSuggestInput from './AutoSuggestInput';
import useCompositionSuggestions from '../hooks/useCompositionSuggestions';

const MedicineSearch = ({ onSelect, searchBy = 'composition' }) => {
  const [query, setQuery] = useState('');

  // For now we only implement the composition hook; if searchBy === 'name' keep using composition hook
  const { suggestions, loading } = useCompositionSuggestions(query, { limit: 10, delay: 300 });

  const handleSelect = (medicine, newValue) => {
    if (onSelect) onSelect(medicine, newValue);
    setQuery('');
  };

  const placeholderText = searchBy === 'name'
    ? 'Search medicine by name...'
    : 'Search medicine by composition...';

  return (
    <div style={{ position: 'relative', flexGrow: 1 }}>
      <AutoSuggestInput
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onSelect={handleSelect}
        suggestions={suggestions}
        placeholder={loading ? 'Searching...' : placeholderText}
      />
    </div>
  );
};

export default MedicineSearch;