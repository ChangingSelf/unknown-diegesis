/* eslint-disable @typescript-eslint/no-explicit-any */
import { BaseValidator } from './BaseValidator';
import type { TiptapDocument } from '@/types/tiptap';
import type { ValidationResult } from './BaseValidator';

/**
 * TiptapContentValidator
 * Validates the structural integrity of a TiptapDocument used by the editor.
 * - Ensures top-level document is a "doc" with a content array
 * - Ensures top-level nodes are allowed block containers (blockWrapper)
 * - Validates common required attributes on blockWrapper, diceBlock and imageBlock
 * - Traverses the tree to validate nested structures as far as reasonable
 * - Detects circular references among blockWrapper nodes via the `references` attrs
 * - Returns detailed error information with a path for each issue
 */
export class TiptapContentValidator extends BaseValidator<TiptapDocument> {
  constructor(data: TiptapDocument) {
    super(data);
  }

  public validate(): ValidationResult {
    // Clear previous state just in case
    this.errors = [];
    this.warnings = [];

    if (!this.data) {
      this.addError('doc', 'Document is empty');
      return this._buildResult();
    }

    // Basic shape checks
    if (this.data.type !== 'doc') {
      this.addError('doc.type', 'Document.type must be "doc"');
    }

    if (!Array.isArray(this.data.content)) {
      this.addError('doc.content', 'Document.content must be an array');
      return this._buildResult();
    }

    // Validate top-level blocks - in this project the top-level content is
    // expected to be Block Wrappers.
    this.data.content.forEach((node, idx) => {
      const path = `doc.content[${idx}]`;
      if (!node || typeof node !== 'object' || typeof node.type !== 'string') {
        this.addError(path, 'Top-level node must be an object with a string type');
        return;
      }
      if (node.type !== 'blockWrapper') {
        this.addError(
          path,
          `Unexpected top-level node type "${node.type}". Expected "blockWrapper".`
        );
      }
      this._validateNode(node, path);
    });

    // Circular reference detection across all blockWrapper nodes
    this._detectCircularReferences();

    return this._buildResult();
  }

  // Internal recursive validator for a node and its children
  private _validateNode(node: any, path: string): void {
    if (!node || typeof node !== 'object') {
      this.addError(path, 'Node must be an object');
      return;
    }

    const type = node.type;
    // Children validation
    if (Array.isArray(node.content)) {
      node.content.forEach((child: any, idx: number) => {
        this._validateNode(child, `${path}.content[${idx}]`);
      });
    }

    // Attribute validation per type
    switch (type) {
      case 'blockWrapper': {
        const a = node.attrs ?? {};
        if (typeof a.id !== 'string') {
          this.addError(`${path}.attrs.id`, 'blockWrapper.id must be a string');
        }
        if (typeof a.blockType !== 'string') {
          this.addError(`${path}.attrs.blockType`, 'blockWrapper.blockType must be a string');
        }
        // created/modified are optional ISO strings; skip strict validation for them
        break;
      }
      case 'diceBlock': {
        const a = node.attrs ?? {};
        if (typeof a.id !== 'string') {
          this.addError(`${path}.attrs.id`, 'diceBlock.id must be a string');
        }
        if (typeof a.formula !== 'string') {
          this.addError(`${path}.attrs.formula`, 'diceBlock.formula must be a string');
        }
        if (a.result != null && typeof a.result !== 'number') {
          this.addError(`${path}.attrs.result`, 'diceBlock.result must be a number when present');
        }
        break;
      }
      case 'imageBlock': {
        const a = node.attrs ?? {};
        if (typeof a.id !== 'string') {
          this.addError(`${path}.attrs.id`, 'imageBlock.id must be a string');
        }
        if (typeof a.src !== 'string') {
          this.addError(`${path}.attrs.src`, 'imageBlock.src must be a string');
        }
        break;
      }
      default:
        // Other node types (paragraph, heading, text, etc.) are allowed as nested content
        // No strict checks here beyond structural validation above
        break;
    }
  }

  // Detect circular references among blockWrapper nodes by traversing the tree
  private _detectCircularReferences(): void {
    const wrappers: Array<{ id: string; refs: string[]; path: string }> = [];
    const walk = (node: any, path: string) => {
      if (!node || typeof node !== 'object') return;
      if (node.type === 'blockWrapper') {
        const id = typeof node.attrs?.id === 'string' ? node.attrs.id : null;
        const refs = Array.isArray(node.attrs?.references) ? node.attrs.references : [];
        if (id) wrappers.push({ id, refs, path });
      }
      if (Array.isArray(node.content)) {
        node.content.forEach((child: any, idx: number) => walk(child, `${path}.content[${idx}]`));
      }
    };

    walk(this.data, 'doc');

    // Build adjacency and run a simple DFS cycle detection
    const adj = new Map<string, string[]>();
    wrappers.forEach(w => adj.set(w.id, w.refs));
    const visited = new Set<string>();
    const onStack = new Set<string>();
    let cycleDetected = false;
    const dfs = (id: string) => {
      if (cycleDetected) return;
      if (onStack.has(id)) {
        cycleDetected = true;
        return;
      }
      if (!adj.has(id)) return;
      onStack.add(id);
      for (const nxt of adj.get(id) || []) {
        dfs(nxt);
        if (cycleDetected) return;
      }
      onStack.delete(id);
      visited.add(id);
    };

    for (const id of adj.keys()) {
      if (!visited.has(id)) dfs(id);
      if (cycleDetected) {
        this.addError(
          'references',
          'Circular reference detected among blockWrapper nodes',
          'circular_reference'
        );
        break;
      }
    }
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

export default TiptapContentValidator;
