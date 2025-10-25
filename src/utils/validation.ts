export interface ValidationRule {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  custom?: (value: any) => string | null;
}

export interface ValidationRules {
  [key: string]: ValidationRule;
}

export interface ValidationErrors {
  [key: string]: string;
}

export const validateField = (value: any, rules: ValidationRule): string | null => {
  // Required validation
  if (rules.required && (!value || (typeof value === 'string' && !value.trim()))) {
    return 'This field is required';
  }

  // Skip other validations if value is empty and not required
  if (!value || (typeof value === 'string' && !value.trim())) {
    return null;
  }

  // Min length validation
  if (rules.minLength && typeof value === 'string' && value.length < rules.minLength) {
    return `Must be at least ${rules.minLength} characters`;
  }

  // Max length validation
  if (rules.maxLength && typeof value === 'string' && value.length > rules.maxLength) {
    return `Must be no more than ${rules.maxLength} characters`;
  }

  // Pattern validation
  if (rules.pattern && typeof value === 'string' && !rules.pattern.test(value)) {
    return 'Invalid format';
  }

  // Custom validation
  if (rules.custom) {
    return rules.custom(value);
  }

  return null;
};

export const validateForm = (data: any, rules: ValidationRules): ValidationErrors => {
  const errors: ValidationErrors = {};

  Object.keys(rules).forEach(field => {
    const fieldRules = rules[field];
    const value = data[field];
    const error = validateField(value, fieldRules);
    
    if (error) {
      errors[field] = error;
    }
  });

  return errors;
};

// Common validation rules
export const commonRules = {
  required: { required: true },
  email: { 
    required: true, 
    pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/ 
  },
  name: { 
    required: true, 
    minLength: 2, 
    maxLength: 100 
  },
  title: { 
    required: true, 
    minLength: 2, 
    maxLength: 200 
  },
  description: { 
    maxLength: 1000 
  },
  optionalDescription: { 
    maxLength: 1000 
  },
  password: { 
    required: true, 
    minLength: 8 
  },
  phone: { 
    pattern: /^[\+]?[1-9][\d]{0,15}$/ 
  },
  url: { 
    pattern: /^https?:\/\/.+/ 
  }
};

// Date validation helpers
export const validateDateRange = (startDate: string | Date, endDate: string | Date): string | null => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  if (start >= end) {
    return 'End date must be after start date';
  }
  
  return null;
};

export const validateFutureDate = (date: string | Date): string | null => {
  const targetDate = new Date(date);
  const now = new Date();
  
  if (targetDate <= now) {
    return 'Date must be in the future';
  }
  
  return null;
};

export const validatePastDate = (date: string | Date): string | null => {
  const targetDate = new Date(date);
  const now = new Date();
  
  if (targetDate >= now) {
    return 'Date must be in the past';
  }
  
  return null;
};

// Email validation
export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Password validation
export const validatePassword = (password: string): boolean => {
  return password.length >= 6;
};