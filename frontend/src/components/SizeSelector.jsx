// src/components/SizeSelector.jsx

import { useState } from 'react';

export default function SizeSelector({ sizes }) {
  const safeSizes = sizes || [];
  const [selected, setSelected] = useState(safeSizes[0] || null);

  if (safeSizes.length === 0) return null;

  return (
    <div className="flex items-center space-x-2">
      <span className="text-sm font-medium text-gray-700 dark:text-gray-200">Size:</span>
      <div className="flex gap-1">
        {safeSizes.map((size) => (
          <button
            key={size}
            onClick={() => setSelected(size)}
            className={`px-2 py-1 border rounded-md text-sm focus:outline-none ${selected === size ? 'bg-primary text-white border-primary' : 'bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200'}`}
          >
            {size}
          </button>
        ))}
      </div>
    </div>
  );
}
