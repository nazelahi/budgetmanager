export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

export interface ValidationRule {
  field: string;
  validator: (value: any) => boolean;
  errorMessage: string;
}

export class ValidationService {
  static validateTransaction(data: {
    amount: string | number;
    description: string;
    category: string;
    type: 'income' | 'expense';
    date: string;
  }): ValidationResult {
    const errors: string[] = [];
    
    // Amount validation
    const amount = typeof data.amount === 'string' ? parseFloat(data.amount) : data.amount;
    if (!amount || isNaN(amount) || amount <= 0) {
      errors.push('Amount must be a positive number');
    }
    if (amount > 999999999) {
      errors.push('Amount cannot exceed $999,999,999');
    }
    
    // Description validation
    if (!data.description || data.description.trim().length === 0) {
      errors.push('Description is required');
    }
    if (data.description && data.description.trim().length > 100) {
      errors.push('Description cannot exceed 100 characters');
    }
    
    // Category validation
    if (!data.category || data.category.trim().length === 0) {
      errors.push('Category is required');
    }
    
    // Type validation
    if (!data.type || !['income', 'expense'].includes(data.type)) {
      errors.push('Transaction type must be income or expense');
    }
    
    // Date validation
    if (!data.date) {
      errors.push('Date is required');
    } else {
      const date = new Date(data.date);
      if (isNaN(date.getTime())) {
        errors.push('Invalid date format');
      }
      const now = new Date();
      const oneYearAgo = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
      const oneYearFromNow = new Date(now.getFullYear() + 1, now.getMonth(), now.getDate());
      
      if (date < oneYearAgo) {
        errors.push('Date cannot be more than 1 year in the past');
      }
      if (date > oneYearFromNow) {
        errors.push('Date cannot be more than 1 year in the future');
      }
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }
  
  static validateBudget(data: {
    amount: string | number;
    categoryId: string;
    period: 'monthly' | 'weekly' | 'yearly';
  }): ValidationResult {
    const errors: string[] = [];
    
    // Amount validation
    const amount = typeof data.amount === 'string' ? parseFloat(data.amount) : data.amount;
    if (!amount || isNaN(amount) || amount <= 0) {
      errors.push('Budget amount must be a positive number');
    }
    if (amount > 999999999) {
      errors.push('Budget amount cannot exceed $999,999,999');
    }
    
    // Category validation
    if (!data.categoryId || data.categoryId.trim().length === 0) {
      errors.push('Category is required');
    }
    
    // Period validation
    if (!data.period || !['monthly', 'weekly', 'yearly'].includes(data.period)) {
      errors.push('Budget period must be monthly, weekly, or yearly');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }
  
  static validateCategory(data: {
    name: string;
    type: 'income' | 'expense';
    color: string;
    icon: string;
  }): ValidationResult {
    const errors: string[] = [];
    
    // Name validation
    if (!data.name || data.name.trim().length === 0) {
      errors.push('Category name is required');
    }
    if (data.name && data.name.trim().length > 50) {
      errors.push('Category name cannot exceed 50 characters');
    }
    
    // Type validation
    if (!data.type || !['income', 'expense'].includes(data.type)) {
      errors.push('Category type must be income or expense');
    }
    
    // Color validation
    if (!data.color || !/^#[0-9A-F]{6}$/i.test(data.color)) {
      errors.push('Invalid color format. Use hex color (e.g., #FF0000)');
    }
    
    // Icon validation
    if (!data.icon || data.icon.trim().length === 0) {
      errors.push('Icon is required');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }
  
  static validateCurrencyInput(input: string): string {
    // Remove all non-numeric characters except decimal point
    let cleaned = input.replace(/[^0-9.]/g, '');
    
    // Ensure only one decimal point
    const parts = cleaned.split('.');
    if (parts.length > 2) {
      cleaned = parts[0] + '.' + parts.slice(1).join('');
    }
    
    // Limit to 2 decimal places
    if (parts.length === 2 && parts[1].length > 2) {
      cleaned = parts[0] + '.' + parts[1].substring(0, 2);
    }
    
    return cleaned;
  }
  
  static validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }
  
  static sanitizeString(input: string): string {
    return input
      .trim()
      .replace(/[<>]/g, '') // Remove potential HTML tags
      .replace(/[&]/g, '&amp;') // Escape ampersands
      .substring(0, 1000); // Limit length
  }
}

export class ErrorHandler {
  static handleError(error: any, context: string): string {
    console.error(`Error in ${context}:`, error);
    
    if (typeof error === 'string') {
      return error;
    }
    
    if (error?.message) {
      return error.message;
    }
    
    if (error?.code) {
      switch (error.code) {
        case 'STORAGE_ERROR':
          return 'Failed to save data. Please try again.';
        case 'NETWORK_ERROR':
          return 'Network error. Please check your connection.';
        case 'VALIDATION_ERROR':
          return 'Invalid data provided. Please check your input.';
        default:
          return 'An unexpected error occurred. Please try again.';
      }
    }
    
    return 'An unexpected error occurred. Please try again.';
  }
  
  static createError(message: string, code?: string): Error {
    const error = new Error(message);
    if (code) {
      (error as any).code = code;
    }
    return error;
  }
}
