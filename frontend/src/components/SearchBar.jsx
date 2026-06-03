import { useEffect, useRef, useState } from 'react';
import { FiSearch, FiX } from 'react-icons/fi';
import { Link } from 'react-router-dom';
import useProducts from '../hooks/useProducts';
import useSearch from '../hooks/useSearch';

export default function SearchBar({ query, setQuery, onClose }) {
  const inputRef = useRef(null);

  // Autofocus when opened on mobile
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  const handleChange = (e) => setQuery(e.target.value);
  
  const suggestions = useSearch(useProducts(), query);
  const showSuggestions = query.trim().length > 0 && suggestions.length > 0;

  return (
    <div className="relative">
      <div className="search-bar-container relative flex items-center bg-gray-100 dark:bg-gray-800 rounded-md p-2">
        <FiSearch className="text-gray-500 w-5 h-5 mr-2" />
        <input
          ref={inputRef}
          type="text"
          placeholder="Search by name or code..."
          className="flex-1 bg-transparent outline-none text-sm"
          value={query}
          onChange={handleChange}
        />
        {onClose && (
          <button onClick={onClose} className="p-1 focus:outline-none">
            <FiX className="w-4 h-4 text-gray-500" />
          </button>
        )}
      </div>

      {/* Suggestions Dropdown */}
      {showSuggestions && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-gray-800 shadow-xl rounded-md border border-gray-200 dark:border-gray-700 max-h-60 overflow-y-auto z-50">
          {suggestions.map((p) => (
            <Link
              key={p.id}
              to={`/product/${p.id}`}
              onClick={() => {
                setQuery('');
                if (onClose) onClose();
              }}
              className="flex items-center p-3 border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 last:border-0"
            >
              <img src={p.image} alt={p.title} className="w-10 h-10 object-cover rounded mr-3" />
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{p.title}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{p.productCode}</p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
