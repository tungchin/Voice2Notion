import { Category } from './types';

export const CATEGORY_COLORS: Record<Category, string> = {
  [Category.WORK]: 'bg-blue-100 text-blue-800 border-blue-200',
  [Category.PERSONAL]: 'bg-green-100 text-green-800 border-green-200',
  [Category.IDEAS]: 'bg-purple-100 text-purple-800 border-purple-200',
  [Category.TODO]: 'bg-red-100 text-red-800 border-red-200',
  [Category.OTHER]: 'bg-gray-100 text-gray-800 border-gray-200',
};
