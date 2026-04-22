"use client";

import { useCallback, useEffect, useRef } from "react";

type DebouncedCallback<T extends (...args: never[]) => void> = {
  run: (...args: Parameters<T>) => void;
  cancel: () => void;
  flush: () => void;
};

export function useDebounceCallback<T extends (...args: never[]) => void>(
  callback: T,
  delay = 300,
): DebouncedCallback<T> {
  const callbackRef = useRef(callback);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastArgsRef = useRef<Parameters<T> | null>(null);

  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  const cancel = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    lastArgsRef.current = null;
  }, []);

  const flush = useCallback(() => {
    if (!lastArgsRef.current) return;

    const nextArgs = lastArgsRef.current;
    cancel();
    callbackRef.current(...nextArgs);
  }, [cancel]);

  const run = useCallback(
    (...args: Parameters<T>) => {
      lastArgsRef.current = args;

      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      timeoutRef.current = setTimeout(() => {
        const nextArgs = lastArgsRef.current;
        timeoutRef.current = null;
        lastArgsRef.current = null;

        if (nextArgs) {
          callbackRef.current(...nextArgs);
        }
      }, delay);
    },
    [delay],
  );

  useEffect(() => cancel, [cancel]);

  return {
    run,
    cancel,
    flush,
  };
}
