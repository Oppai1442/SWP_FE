import { useState, useCallback, useMemo } from 'react';
import { usePerformanceOptimization } from './usePerformanceOptimization';

interface FormField {
  value: any;
  error?: string;
  touched: boolean;
}

type FormFields<T> = {
  [K in keyof T]: FormField;
};

interface UseFormOptions<T> {
  initialValues: T;
  validate?: (values: T) => Partial<Record<keyof T, string>>;
  onSubmit: (values: T) => void | Promise<void>;
}

export const useForm = <T extends Record<string, any>>({
  initialValues,
  validate,
  onSubmit,
}: UseFormOptions<T>) => {
  const [fields, setFields] = useState<FormFields<T>>(() =>
    Object.keys(initialValues).reduce((acc, key) => ({
      ...acc,
      [key]: {
        value: initialValues[key as keyof T],
        touched: false,
      },
    }), {} as FormFields<T>)
  );

  const { useDebounce } = usePerformanceOptimization();

  const values = useMemo(() =>
    Object.keys(fields).reduce((acc, key) => ({
      ...acc,
      [key]: fields[key as keyof T].value,
    }), {} as T),
    [fields]
  );

  const errors = useMemo(() => {
    if (!validate) return {};
    return validate(values);
  }, [values, validate]);

  const debouncedValidate = useDebounce(validate || (() => ({})), 300);

  const handleChange = useCallback((name: keyof T, value: any) => {
    setFields(prev => ({
      ...prev,
      [name]: {
        ...prev[name],
        value,
        touched: true,
      },
    }));
    debouncedValidate(values);
  }, [debouncedValidate, values]);

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) {
      e.preventDefault();
    }

    const validationErrors = validate ? validate(values) : {};
    const hasErrors = Object.keys(validationErrors).length > 0;

    if (hasErrors) {
      setFields(prev =>
        Object.keys(prev).reduce((acc, key) => ({
          ...acc,
          [key]: {
            ...prev[key as keyof T],
            touched: true,
            error: validationErrors[key as keyof T],
          },
        }), {} as FormFields<T>)
      );
      return;
    }

    await onSubmit(values);
  };

  const reset = useCallback(() => {
    setFields(
      Object.keys(initialValues).reduce((acc, key) => ({
        ...acc,
        [key]: {
          value: initialValues[key as keyof T],
          touched: false,
        },
      }), {} as FormFields<T>)
    );
  }, [initialValues]);

  return {
    values,
    errors,
    touched: Object.keys(fields).reduce((acc, key) => ({
      ...acc,
      [key]: fields[key as keyof T].touched,
    }), {} as Record<keyof T, boolean>),
    handleChange,
    handleSubmit,
    reset,
  };
};
