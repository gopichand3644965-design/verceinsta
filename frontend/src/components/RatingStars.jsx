// src/components/RatingStars.jsx

import { FiStar } from 'react-icons/fi';
import { FaStarHalfAlt } from 'react-icons/fa';

export default function RatingStars({ rating }) {
  const numericRating = Math.min(5, Math.max(0, Number(rating) || 0));
  const fullStars = Math.floor(numericRating);
  const half = numericRating - fullStars >= 0.5;
  const emptyStars = Math.max(0, 5 - fullStars - (half ? 1 : 0));

  return (
    <div className="flex items-center space-x-0.5 text-yellow-500">
      {[...Array(fullStars)].map((_, i) => (
        <FiStar key={`full-${i}`} className="w-4 h-4" />
      ))}
      {half && <FaStarHalfAlt className="w-4 h-4" />}
      {[...Array(emptyStars)].map((_, i) => (
        <FiStar key={`empty-${i}`} className="w-4 h-4 text-gray-300" />
      ))}
    </div>
  );
}
