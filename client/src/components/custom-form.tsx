import { useState, forwardRef, InputHTMLAttributes, ButtonHTMLAttributes, LabelHTMLAttributes } from "react";

// Custom Input Component
interface CustomInputProps extends InputHTMLAttributes<HTMLInputElement> {
  error?: string;
  label?: string;
}

export const CustomInput = forwardRef<HTMLInputElement, CustomInputProps>(
  ({ className = "", error, label, id, ...props }, ref) => {
    const inputId = id || `input-${Date.now()}-${Math.random()}`;
    
    return (
      <div className="w-full">
        {label && (
          <label 
            htmlFor={inputId}
            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
          >
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={`
            w-full px-3 py-2 border rounded-md shadow-sm
            ${error 
              ? 'border-red-500 focus:border-red-500 focus:ring-red-500' 
              : 'border-gray-300 dark:border-gray-600 focus:border-blue-500 focus:ring-blue-500'
            }
            bg-white dark:bg-gray-800 
            text-gray-900 dark:text-gray-100
            placeholder-gray-500 dark:placeholder-gray-400
            focus:outline-none focus:ring-2 focus:ring-opacity-50
            disabled:opacity-50 disabled:cursor-not-allowed
            ${className}
          `}
          {...props}
        />
        {error && (
          <p className="mt-1 text-sm text-red-600 dark:text-red-400">
            {error}
          </p>
        )}
      </div>
    );
  }
);

CustomInput.displayName = "CustomInput";

// Custom Button Component
interface CustomButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
}

export const CustomButton = forwardRef<HTMLButtonElement, CustomButtonProps>(
  ({ className = "", variant = 'primary', size = 'md', loading = false, children, disabled, ...props }, ref) => {
    const baseClasses = "inline-flex items-center justify-center font-medium rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed";
    
    const variantClasses = {
      primary: "bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500",
      secondary: "bg-gray-600 text-white hover:bg-gray-700 focus:ring-gray-500", 
      outline: "border border-gray-300 dark:border-gray-600 bg-transparent text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 focus:ring-blue-500",
      ghost: "bg-transparent text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 focus:ring-gray-500"
    };
    
    const sizeClasses = {
      sm: "px-3 py-1.5 text-sm",
      md: "px-4 py-2 text-sm",
      lg: "px-6 py-3 text-base"
    };
    
    return (
      <button
        ref={ref}
        className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
        disabled={disabled || loading}
        {...props}
      >
        {loading && (
          <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        )}
        {children}
      </button>
    );
  }
);

CustomButton.displayName = "CustomButton";

// Custom Label Component
interface CustomLabelProps extends LabelHTMLAttributes<HTMLLabelElement> {
  required?: boolean;
}

export const CustomLabel = forwardRef<HTMLLabelElement, CustomLabelProps>(
  ({ className = "", children, required, ...props }, ref) => {
    return (
      <label
        ref={ref}
        className={`block text-sm font-medium text-gray-700 dark:text-gray-300 ${className}`}
        {...props}
      >
        {children}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
    );
  }
);

CustomLabel.displayName = "CustomLabel";

// Custom Form Component
interface CustomFormProps {
  onSubmit: (e: React.FormEvent) => void;
  children: React.ReactNode;
  className?: string;
}

export const CustomForm = ({ onSubmit, children, className = "" }: CustomFormProps) => {
  return (
    <form onSubmit={onSubmit} className={`space-y-4 ${className}`}>
      {children}
    </form>
  );
};

// Custom Checkbox Component
interface CustomCheckboxProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

export const CustomCheckbox = forwardRef<HTMLInputElement, CustomCheckboxProps>(
  ({ className = "", label, id, ...props }, ref) => {
    const checkboxId = id || `checkbox-${Date.now()}-${Math.random()}`;
    
    return (
      <div className="flex items-center">
        <input
          ref={ref}
          type="checkbox"
          id={checkboxId}
          className={`
            h-4 w-4 text-blue-600 border-gray-300 dark:border-gray-600 rounded
            focus:ring-blue-500 focus:ring-2 focus:ring-offset-0
            bg-white dark:bg-gray-800
            ${className}
          `}
          {...props}
        />
        {label && (
          <label 
            htmlFor={checkboxId}
            className="ml-2 block text-sm text-gray-700 dark:text-gray-300"
          >
            {label}
          </label>
        )}
      </div>
    );
  }
);

CustomCheckbox.displayName = "CustomCheckbox";