interface DropdownOption {
  value: string;
  label: string;
  group?: string;
}

interface FormDropdownProps {
  name: string;
  value?: string;
  options: DropdownOption[];
  placeholder?: string;
  required?: boolean;
  class?: string;
}

export function FormDropdown({ name, value, options, placeholder, class: cls }: FormDropdownProps) {
  const selected = options.find(o => o.value === value);
  const displayLabel = selected?.label ?? placeholder ?? '-- Select --';

  const hasGroups = options.some(o => o.group);

  return (
    <div class={`form-dropdown ${cls ?? ''}`}>
      <button type="button" class="form-dropdown-trigger" aria-haspopup="listbox">
        <span class="form-dropdown-label">{displayLabel}</span>
      </button>
      <ul role="listbox" class="form-dropdown-list">
        {placeholder && (
          <li>
            <button type="button" data-value="" data-label={placeholder}
              aria-selected={!value ? 'true' : undefined}>
              {placeholder}
            </button>
          </li>
        )}
        {hasGroups ? (
          [...new Set(options.map(o => o.group))].map(group => (
            <>
              {group && (
                <li class="px-3 py-1 text-xs font-semibold text-muted uppercase tracking-wide">{group}</li>
              )}
              {options.filter(o => o.group === group).map(o => (
                <li>
                  <button type="button" data-value={o.value} data-label={o.label}
                    aria-selected={o.value === value ? 'true' : undefined}>
                    {o.label}
                  </button>
                </li>
              ))}
            </>
          ))
        ) : (
          options.map(o => (
            <li>
              <button type="button" data-value={o.value} data-label={o.label}
                aria-selected={o.value === value ? 'true' : undefined}>
                {o.label}
              </button>
            </li>
          ))
        )}
      </ul>
      <input type="hidden" name={name} value={value ?? ''} />
    </div>
  );
}
