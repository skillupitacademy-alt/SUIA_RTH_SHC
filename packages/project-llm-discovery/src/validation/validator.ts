export interface ValidationError {
  validator: string;
  code: string;
  message: string;
  path?: string;
  details?: Record<string, unknown>;
}

export interface ValidationWarning {
  validator: string;
  code: string;
  message: string;
  path?: string;
  details?: Record<string, unknown>;
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
}
