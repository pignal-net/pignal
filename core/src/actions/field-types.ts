import type { SiteActionField } from '@pignal/db';

export interface FieldTypeHandler {
  type: string;
  /** Validate a value. Return null if valid, error message string if invalid. */
  validate(value: string, field: SiteActionField): string | null;
  /** Sanitize/clean a value before storage. */
  sanitize(value: string, field: SiteActionField): string;
}

export class FieldTypeRegistry {
  private types = new Map<string, FieldTypeHandler>();

  register(handler: FieldTypeHandler): void {
    this.types.set(handler.type, handler);
  }

  get(type: string): FieldTypeHandler | undefined {
    return this.types.get(type);
  }

  has(type: string): boolean {
    return this.types.has(type);
  }

  /** Validate a value against a field definition. Uses the registered handler for field.type. */
  validate(value: string, field: SiteActionField): string | null {
    if (field.required && !value.trim()) {
      return `${field.label} is required`;
    }
    if (!value.trim()) return null; // empty non-required field is valid
    const handler = this.types.get(field.type);
    if (!handler) return null;
    return handler.validate(value, field);
  }

  /** Sanitize a value. Falls back to trim() if no handler registered. */
  sanitize(value: string, field: SiteActionField): string {
    const handler = this.types.get(field.type);
    if (!handler) return value.trim();
    return handler.sanitize(value, field);
  }
}

// --- Built-in field type handlers ---

function validateMaxLength(
  value: string,
  field: SiteActionField,
): string | null {
  if (field.maxLength && value.length > field.maxLength) {
    return `${field.label} must be at most ${field.maxLength} characters`;
  }
  return null;
}

const textHandler: FieldTypeHandler = {
  type: 'text',
  validate(value, field) {
    return validateMaxLength(value, field);
  },
  sanitize(value) {
    return value.trim();
  },
};

const emailHandler: FieldTypeHandler = {
  type: 'email',
  validate(value, field) {
    const trimmed = value.trim();
    if (trimmed.length > 0 && (!trimmed.includes('@') || !trimmed.includes('.'))) {
      return `${field.label} must be a valid email address`;
    }
    return validateMaxLength(trimmed, field);
  },
  sanitize(value) {
    return value.trim().toLowerCase();
  },
};

const textareaHandler: FieldTypeHandler = {
  type: 'textarea',
  validate(value, field) {
    return validateMaxLength(value, field);
  },
  sanitize(value) {
    return value.trim();
  },
};

const selectHandler: FieldTypeHandler = {
  type: 'select',
  validate(value, field) {
    const trimmed = value.trim();
    if (trimmed.length === 0) return null;
    if (!field.options || field.options.length === 0) return null;
    const validValues = field.options.map((o) => o.value);
    if (!validValues.includes(trimmed)) {
      return `${field.label} must be one of: ${validValues.join(', ')}`;
    }
    return null;
  },
  sanitize(value) {
    return value.trim();
  },
};

const urlHandler: FieldTypeHandler = {
  type: 'url',
  validate(value, field) {
    const trimmed = value.trim();
    if (
      trimmed.length > 0 &&
      !trimmed.startsWith('http://') &&
      !trimmed.startsWith('https://')
    ) {
      return `${field.label} must start with http:// or https://`;
    }
    return validateMaxLength(trimmed, field);
  },
  sanitize(value) {
    return value.trim();
  },
};

const telHandler: FieldTypeHandler = {
  type: 'tel',
  validate(value, field) {
    const trimmed = value.trim();
    if (trimmed.length > 0 && !/^[0-9\s+\-()]+$/.test(trimmed)) {
      return `${field.label} must contain only digits, spaces, +, -, and parentheses`;
    }
    return validateMaxLength(trimmed, field);
  },
  sanitize(value) {
    return value.trim();
  },
};

const numberHandler: FieldTypeHandler = {
  type: 'number',
  validate(value, field) {
    const trimmed = value.trim();
    if (trimmed.length > 0 && isNaN(parseFloat(trimmed))) {
      return `${field.label} must be a valid number`;
    }
    return validateMaxLength(trimmed, field);
  },
  sanitize(value) {
    return value.trim();
  },
};

const checkboxHandler: FieldTypeHandler = {
  type: 'checkbox',
  validate(value, field) {
    const trimmed = value.trim().toLowerCase();
    const validValues = ['true', 'false', 'on', ''];
    if (!validValues.includes(trimmed)) {
      return `${field.label} must be a boolean value`;
    }
    return null;
  },
  sanitize(value) {
    const trimmed = value.trim().toLowerCase();
    return trimmed === 'true' || trimmed === 'on' ? 'true' : 'false';
  },
};

/** Create a registry with all built-in field types pre-registered. */
export function createDefaultFieldTypes(): FieldTypeRegistry {
  const registry = new FieldTypeRegistry();
  registry.register(textHandler);
  registry.register(emailHandler);
  registry.register(textareaHandler);
  registry.register(selectHandler);
  registry.register(urlHandler);
  registry.register(telHandler);
  registry.register(numberHandler);
  registry.register(checkboxHandler);
  return registry;
}
