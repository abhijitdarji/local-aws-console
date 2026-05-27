'use client';

import { createRef, useCallback, useState } from 'react';

export interface UseFormProps<T> {
  initialValue: T | (() => T);
  validate: (form: T) => Record<string, string | string[]> | null;
}

export function useForm<T>(props: UseFormProps<T>) {
  const [initialProps] = useState(props);
  const [data, setData] = useState(() => {
    const value =
      typeof props.initialValue === 'function'
        ? (props.initialValue as () => T)()
        : props.initialValue;
    return { dirty: false, value };
  });
  const [errors, setErrors] = useState<Record<string, string | string[]>>({});
  const [errorRef] = useState(() => {
    const refs: Record<string, React.RefObject<HTMLInputElement | null>> = {};
    for (const field in data.value) {
      refs[field] = createRef();
    }
    return refs;
  });

  const validate = useCallback(() => {
    const errs = initialProps.validate(data.value);
    setErrors(errs ?? {});
    setData((current) => ({ ...current, dirty: true }));

    if (errs !== null) {
      for (const field in errs) {
        if (errorRef[field]?.current) {
          errorRef[field].current?.focus();
          break;
        }
      }
    }

    return errs === null || Object.keys(errs).length === 0;
  }, [data, initialProps, errorRef]);

  const onChange = useCallback(
    (partial: Partial<T>, resetDirty = false) => {
      setData((current) => {
        const dirty = resetDirty ? false : current.dirty;
        const updatedData = { ...current, dirty, value: { ...current.value, ...partial } };
        if (dirty) {
          const errs = initialProps.validate(updatedData.value);
          setErrors(errs ?? {});
        }
        return updatedData;
      });
    },
    [initialProps],
  );

  return { data: data.value, onChange, errors, validate, errorRef };
}
