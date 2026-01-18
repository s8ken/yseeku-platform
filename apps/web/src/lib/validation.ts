export interface ValidationError {
  field: string;
  message: string;
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
}

export function validateRequired(value: any, field: string): ValidationError | null {
  if (value === undefined || value === null || value === '') {
    return { field, message: `${field} is required` };
  }
  return null;
}

export function validateString(value: any, field: string, options?: { minLength?: number; maxLength?: number; pattern?: RegExp }): ValidationError | null {
  if (typeof value !== 'string') {
    return { field, message: `${field} must be a string` };
  }
  
  if (options?.minLength && value.length < options.minLength) {
    return { field, message: `${field} must be at least ${options.minLength} characters` };
  }
  
  if (options?.maxLength && value.length > options.maxLength) {
    return { field, message: `${field} must be at most ${options.maxLength} characters` };
  }
  
  if (options?.pattern && !options.pattern.test(value)) {
    return { field, message: `${field} has invalid format` };
  }
  
  return null;
}

export function validateNumber(value: any, field: string, options?: { min?: number; max?: number; integer?: boolean }): ValidationError | null {
  const num = typeof value === 'string' ? parseFloat(value) : value;
  
  if (typeof num !== 'number' || isNaN(num)) {
    return { field, message: `${field} must be a number` };
  }
  
  if (options?.min !== undefined && num < options.min) {
    return { field, message: `${field} must be at least ${options.min}` };
  }
  
  if (options?.max !== undefined && num > options.max) {
    return { field, message: `${field} must be at most ${options.max}` };
  }
  
  if (options?.integer && !Number.isInteger(num)) {
    return { field, message: `${field} must be an integer` };
  }
  
  return null;
}

export function validateEmail(value: any, field: string): ValidationError | null {
  if (typeof value !== 'string') {
    return { field, message: `${field} must be a string` };
  }
  
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailPattern.test(value)) {
    return { field, message: `${field} must be a valid email address` };
  }
  
  return null;
}

export function validateEnum(value: any, field: string, allowedValues: string[]): ValidationError | null {
  if (!allowedValues.includes(value)) {
    return { field, message: `${field} must be one of: ${allowedValues.join(', ')}` };
  }
  return null;
}

export function validateSymbiDimensions(dimensions: any): ValidationResult {
  const errors: ValidationError[] = [];
  
  if (!dimensions || typeof dimensions !== 'object') {
    return { valid: false, errors: [{ field: 'symbi_dimensions', message: 'Must be an object' }] };
  }
  
  if (dimensions.reality_index !== undefined) {
    const err = validateNumber(dimensions.reality_index, 'reality_index', { min: 0, max: 10 });
    if (err) errors.push(err);
  }
  
  if (dimensions.ethical_alignment !== undefined) {
    const err = validateNumber(dimensions.ethical_alignment, 'ethical_alignment', { min: 0, max: 5 });
    if (err) errors.push(err);
  }
  
  if (dimensions.canvas_parity !== undefined) {
    const err = validateNumber(dimensions.canvas_parity, 'canvas_parity', { min: 0, max: 100 });
    if (err) errors.push(err);
  }
  
  if (dimensions.trust_protocol !== undefined) {
    const err = validateEnum(dimensions.trust_protocol, 'trust_protocol', ['PASS', 'PARTIAL', 'FAIL']);
    if (err) errors.push(err);
  }
  
  if (dimensions.resonance_quality !== undefined) {
    const err = validateEnum(dimensions.resonance_quality, 'resonance_quality', ['NONE', 'WEAK', 'MODERATE', 'STRONG', 'ADVANCED', 'BREAKTHROUGH']);
    if (err) errors.push(err);
  }
  
  return { valid: errors.length === 0, errors };
}

export function validateBedauIndex(index: any): ValidationResult {
  const errors: ValidationError[] = [];
  
  if (!index || typeof index !== 'object') {
    return { valid: false, errors: [{ field: 'bedau_index', message: 'Must be an object' }] };
  }
  
  const components = ['downward_causation', 'weak_emergence', 'strong_emergence', 'nominal_emergence'];
  
  for (const component of components) {
    if (index[component] !== undefined) {
      const err = validateNumber(index[component], component, { min: 0, max: 1 });
      if (err) errors.push(err);
    }
  }
  
  return { valid: errors.length === 0, errors };
}

export function validateTrustScore(value: any): ValidationError | null {
  return validateNumber(value, 'trust_score', { min: 0, max: 100 });
}

export function sanitizeString(value: string): string {
  return value
    .replace(/<[^>]*>/g, '')
    .replace(/[<>'"&]/g, '')
    .trim();
}

export function sanitizeInput<T extends Record<string, any>>(input: T, fields: string[]): T {
  const sanitized = { ...input };
  
  for (const field of fields) {
    if (typeof sanitized[field] === 'string') {
      (sanitized as any)[field] = sanitizeString(sanitized[field]);
    }
  }
  
  return sanitized;
}

export function createValidator(rules: Record<string, (value: any) => ValidationError | null>) {
  return (data: Record<string, any>): ValidationResult => {
    const errors: ValidationError[] = [];
    
    for (const [field, validate] of Object.entries(rules)) {
      const error = validate(data[field]);
      if (error) errors.push(error);
    }
    
    return { valid: errors.length === 0, errors };
  };
}
