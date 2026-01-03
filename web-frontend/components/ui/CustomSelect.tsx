import React, { Fragment } from 'react';
import { Listbox, Transition } from '@headlessui/react';
import { ChevronUpDownIcon, CheckIcon } from '@heroicons/react/20/solid';
import { useTheme } from '../../contexts/ThemeContext';

interface Option {
  id: string | number;
  name: string;
  description?: string;
  icon?: string;
}

interface CustomSelectProps {
  options: Option[];
  value: Option | null | undefined;
  onChange: (option: Option) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

export const CustomSelect: React.FC<CustomSelectProps> = ({
  options,
  value,
  onChange,
  placeholder = "Select an option",
  className = "",
  disabled = false
}) => {
  const { theme } = useTheme();

  return (
    <div className={`relative custom-select-container ${className}`} style={{ minWidth: '200px' }}>
      <Listbox value={value || undefined} onChange={onChange} disabled={disabled}>
        <div className="relative">
          <Listbox.Button
            className="custom-select-button relative w-full cursor-pointer rounded-xl border-2 text-left shadow-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2"
            style={{
              backgroundColor: theme.surface,
              borderColor: theme.border,
              color: theme.text,
              opacity: disabled ? 0.5 : 1,
              cursor: disabled ? 'not-allowed' : 'pointer',
              padding: '0.625rem 2.5rem 0.625rem 1rem',
              minHeight: '2.75rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}
            onMouseEnter={(e) => {
              if (!disabled) {
                e.currentTarget.style.backgroundColor = theme.surfaceHover;
                e.currentTarget.style.borderColor = theme.primary;
              }
            }}
            onMouseLeave={(e) => {
              if (!disabled) {
                e.currentTarget.style.backgroundColor = theme.surface;
                e.currentTarget.style.borderColor = theme.border;
              }
            }}
          >
            <span className="flex items-center gap-2 flex-1 min-w-0">
              {value?.icon && (
                <span className="custom-select-icon flex-shrink-0" style={{ fontSize: '1rem' }}>{value.icon}</span>
              )}
              <span className="custom-select-text block truncate font-semibold" style={{ fontSize: '0.9375rem' }}>
                {value ? value.name : placeholder}
              </span>
              {value?.description && (
                <span 
                  className="text-xs opacity-70 flex-shrink-0 hidden sm:inline"
                  style={{ color: theme.textSecondary, fontSize: '0.75rem' }}
                >
                  ({value.description})
                </span>
              )}
            </span>
            <span className="flex-shrink-0 ml-2">
              <ChevronUpDownIcon
                className="custom-select-chevron h-3 w-3"
                style={{ color: theme.textSecondary }}
                aria-hidden="true"
              />
            </span>
          </Listbox.Button>

          <Transition
            as={Fragment}
            leave="transition ease-in duration-100"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <Listbox.Options 
              className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-lg border shadow-lg focus:outline-none"
              style={{
                backgroundColor: theme.cardBg,
                borderColor: theme.border,
                boxShadow: `0 4px 6px -1px ${theme.shadow}`
              }}
            >
              {options.map((option) => (
                <Listbox.Option
                  key={option.id}
                  value={option}
                  className="relative cursor-pointer select-none transition-colors duration-150"
                >
                  {({ selected, active }) => (
                    <div
                      className="flex items-center justify-between gap-2"
                      style={{
                        backgroundColor: active ? theme.highlight : 'transparent',
                        color: theme.text,
                        padding: '0.625rem 0.75rem',
                        borderRadius: '0.375rem',
                        margin: '0.125rem 0.25rem'
                      }}
                    >
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        {option.icon && (
                          <span className="custom-select-icon flex-shrink-0" style={{ fontSize: '1rem' }}>{option.icon}</span>
                        )}
                        <div className="flex flex-col flex-1 min-w-0">
                          <span
                            className={`custom-select-text block truncate ${
                              selected ? 'font-bold' : 'font-semibold'
                            }`}
                            style={{ fontSize: '0.9375rem' }}
                          >
                            {option.name}
                          </span>
                          {option.description && (
                            <span 
                              className="truncate"
                              style={{ 
                                color: theme.textSecondary,
                                fontSize: '0.6875rem',
                                opacity: 0.75,
                                marginTop: '0.125rem'
                              }}
                            >
                              {option.description}
                            </span>
                          )}
                        </div>
                      </div>
                      {selected && (
                        <CheckIcon 
                          className="h-3 w-3 flex-shrink-0" 
                          style={{ color: theme.success }}
                          aria-hidden="true" 
                        />
                      )}
                    </div>
                  )}
                </Listbox.Option>
              ))}
            </Listbox.Options>
          </Transition>
        </div>
      </Listbox>
    </div>
  );
};