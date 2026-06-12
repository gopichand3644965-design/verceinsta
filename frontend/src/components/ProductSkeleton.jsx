import { motion } from 'framer-motion';

export default function ProductSkeleton() {
  return (
    <div className="block bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden border border-gray-100 dark:border-gray-700 h-full flex flex-col animate-pulse">
      <div className="relative aspect-square bg-gray-200 dark:bg-gray-700"></div>
      <div className="p-3 flex-1 flex flex-col">
        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-2"></div>
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-1"></div>
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-2"></div>
        <div className="mt-auto pt-2">
          <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
        </div>
      </div>
    </div>
  );
}
