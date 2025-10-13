import { Category } from '../types';

/**
 * Get category details by category name
 * @param categoryName - The name of the category to find
 * @param categories - Array of all categories
 * @returns Category object or null if not found
 */
export const getCategoryByName = (categoryName: string, categories: Category[]): Category | null => {
  return categories.find(category => category.name === categoryName) || null;
};

/**
 * Get category icon by category name
 * @param categoryName - The name of the category
 * @param categories - Array of all categories
 * @returns Icon name or default icon
 */
export const getCategoryIcon = (categoryName: string, categories: Category[]): string => {
  const category = getCategoryByName(categoryName, categories);
  return category?.icon || 'pricetag';
};

/**
 * Get category color by category name
 * @param categoryName - The name of the category
 * @param categories - Array of all categories
 * @returns Color string or default color
 */
export const getCategoryColor = (categoryName: string, categories: Category[]): string => {
  const category = getCategoryByName(categoryName, categories);
  return category?.color || '#9E9E9E';
};

/**
 * Get category details (icon and color) by category name
 * @param categoryName - The name of the category
 * @param categories - Array of all categories
 * @returns Object with icon and color
 */
export const getCategoryDetails = (categoryName: string, categories: Category[]) => {
  const category = getCategoryByName(categoryName, categories);
  return {
    icon: category?.icon || 'pricetag',
    color: category?.color || '#9E9E9E'
  };
};
