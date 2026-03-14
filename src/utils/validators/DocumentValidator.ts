/* eslint-disable @typescript-eslint/no-explicit-any */
import { BaseValidator } from './BaseValidator';
import { TiptapContentValidator } from './TiptapContentValidator';
import type { DocumentData } from '@/types/document';
import type { ValidationResult } from './BaseValidator';

/**
 * DocumentValidator validates the overall DocumentData shape used by the editor.
 * It ensures:
 *  - schemaVersion is a number
 *  - type is a non-empty string
 *  - meta contains required fields (id, title, wordCount, created, modified)
 *  - content is valid according to TiptapContentValidator
 */
export class DocumentValidator extends BaseValidator<DocumentData> {
  constructor(data: DocumentData) {
    super(data);
  }

  public validate(): ValidationResult {
    // reset any previous state
    this.errors = [];
    this.warnings = [];

    if (!this.data) {
      this.addError('document', 'DocumentData is empty');
      return this._buildResult();
    }

    // schemaVersion
    if (typeof this.data.schemaVersion !== 'number') {
      this.addError('schemaVersion', 'DocumentData.schemaVersion must be a number');
    }

    // type
    if (!this.data.type || typeof this.data.type !== 'string') {
      this.addError('type', 'DocumentData.type must be a non-empty string');
    }

    // meta: basic presence + required fields
    const meta = this.data.meta as any;
    if (!meta || typeof meta !== 'object') {
      this.addError('meta', 'DocumentData.meta must be an object');
    } else {
      if (typeof meta.id !== 'string' || meta.id.trim() === '') {
        this.addError('meta.id', 'DocumentMeta.id must be a non-empty string');
      }
      if (typeof meta.title !== 'string' || meta.title.trim() === '') {
        this.addError('meta.title', 'DocumentMeta.title must be a non-empty string');
      }
      // wordCount is required to be a number
      if (typeof meta.wordCount !== 'number') {
        this.addError('meta.wordCount', 'DocumentMeta.wordCount must be a number');
      }
      // created/modified should be ISO date strings when present
      if (typeof meta.created !== 'string' || meta.created.trim() === '') {
        this.addError('meta.created', 'DocumentMeta.created must be a string (ISO date)');
      }
      if (typeof meta.modified !== 'string' || meta.modified.trim() === '') {
        this.addError('meta.modified', 'DocumentMeta.modified must be a string (ISO date)');
      }
    }

    // content: delegate to TiptapContentValidator for deep validation
    if (!this.data.content) {
      this.addError('content', 'DocumentData.content is required');
    } else {
      const tiptValidator = new TiptapContentValidator(this.data.content);
      const result = tiptValidator.validate();
      // Merge nested errors/warnings into this validator with path prefixing
      result.errors.forEach(e => {
        this.addError(`content.${e.path}`, e.message, e.code);
      });
      result.warnings.forEach(w => {
        this.addWarning(`content.${w.path}`, w.message, w.code);
      });
    }

    return this._buildResult();
  }

  private _buildResult(): ValidationResult {
    const result: ValidationResult = {
      success: this.errors.length === 0,
      errors: this.errors,
      warnings: this.warnings,
    };
    return BaseValidator.normalizeResult(result);
  }
}

/** Public helper used by callers to validate DocumentData in a single call. */
export function validateDocumentData(data: DocumentData): ValidationResult {
  const validator = new DocumentValidator(data);
  return validator.validate();
}

export default DocumentValidator;
