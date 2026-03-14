/**
 * ValidationError represents a single validation issue.
 */
export interface ValidationError {
  /** Path to the field within the object being validated */
  path: string;
  /** Human-friendly error message */
  message: string;
  /** Optional machine-readable error code */
  code?: string;
}

/**
 * ValidationResult describes a full validation outcome.
 * - success: true when there are no errors
 * - errors: list of hard failures
 * - warnings: non-fatal issues that user may want to address
 */
export interface ValidationResult {
  success: boolean;
  errors: ValidationError[];
  warnings: ValidationError[];
}

import type { DocumentMeta } from '@/types/document';

/**
 * BaseValidator provides a minimal, framework-agnostic foundation for
 * validating objects. Subclasses implement validate() to perform concrete
 * validations and push issues using addError/addWarning.
 *
 * The class is deliberately lightweight and dependency-free to keep the
 * validation framework stable and easily testable.
 *
 * Reference pattern: DocumentMeta shape from src/types/document.ts
 * (lines 33-64) for typical document metadata usage.
 */
export abstract class BaseValidator<T> {
  /** The data object to validate */
  protected data: T;
  /** Collected hard errors during validation */
  protected errors: ValidationError[] = [];
  /** Collected non-fatal warnings during validation */
  protected warnings: ValidationError[] = [];

  constructor(data: T) {
    this.data = data;
  }

  /**
   * Run validations and return a consolidated result.
   * Implementations should populate this.errors / this.warnings
   * and return a ValidationResult reflecting the outcome.
   */
  abstract validate(): ValidationResult;

  /**
   * Add a concrete validation error.
   * @param path Path to the field in the object
   * @param message Human friendly message describing the error
   * @param code Optional machine-readable error code
   */
  protected addError(path: string, message: string, code?: string): void {
    this.errors.push({ path, message, code });
  }

  /**
   * Add a non-fatal validation warning.
   * @param path Path to the field in the object
   * @param message Warning message
   * @param code Optional machine-readable code
   */
  protected addWarning(path: string, message: string, code?: string): void {
    this.warnings.push({ path, message, code });
  }

  /** Convenience: check presence (non-undefined and non-null). */
  protected isPresent(value: unknown): boolean {
    return value !== undefined && value !== null;
  }

  /** Validate that a value is a string. */
  protected assertString(path: string, value: unknown): void {
    if (typeof value !== 'string') {
      this.addError(path, 'Expected string');
    }
  }

  /** Validate that a value is a number. */
  protected assertNumber(path: string, value: unknown): void {
    if (typeof value !== 'number') {
      this.addError(path, 'Expected number');
    }
  }

  /** Validate that a value is a boolean. */
  protected assertBoolean(path: string, value: unknown): void {
    if (typeof value !== 'boolean') {
      this.addError(path, 'Expected boolean');
    }
  }

  /** Validate that a value is an array. */
  protected assertArray(path: string, value: unknown): void {
    if (!Array.isArray(value)) {
      this.addError(path, 'Expected array');
    }
  }

  /**
   * When validating DocumentMeta-like objects, ensure required fields exist
   * and basic types are correct. This is a lightweight helper to help subclasses
   * validate document-related structures without importing heavy schemas.
   */
  protected validateDocumentMetaShape(meta: Partial<DocumentMeta>): boolean {
    // Basic shape checks
    if (!this.isPresent(meta?.id) || typeof meta?.id !== 'string') {
      this.addError('meta.id', 'DocumentMeta.id must be a non-empty string');
    }
    if (!this.isPresent(meta?.title) || typeof meta?.title !== 'string') {
      this.addError('meta.title', 'DocumentMeta.title must be a string');
    }
    if (!this.isPresent(meta?.category) || typeof meta?.category !== 'string') {
      this.addError('meta.category', 'DocumentMeta.category must be a string');
    }
    if (!this.isPresent(meta?.path) || typeof meta?.path !== 'string') {
      this.addError('meta.path', 'DocumentMeta.path must be a string');
    }
    // The rest are optional, but if present should have reasonable types
    if (meta?.wordCount != null && typeof meta.wordCount !== 'number') {
      this.addError('meta.wordCount', 'DocumentMeta.wordCount must be a number');
    }
    if (meta?.created != null && typeof meta.created !== 'string') {
      this.addError('meta.created', 'DocumentMeta.created must be a string (ISO date)');
    }
    if (meta?.modified != null && typeof meta.modified !== 'string') {
      this.addError('meta.modified', 'DocumentMeta.modified must be a string (ISO date)');
    }
    // Return true if there are no hard errors regarding basic shape
    return this.errors.length === 0;
  }

  /** Normalize a ValidationResult so that callers always receive a consistent shape. */
  protected static normalizeResult(result: ValidationResult): ValidationResult {
    const errors = Array.isArray(result.errors) ? result.errors : [];
    const warnings = Array.isArray(result.warnings) ? result.warnings : [];
    return {
      success: errors.length === 0,
      errors,
      warnings,
    };
  }
}
