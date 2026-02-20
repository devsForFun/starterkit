import { useEffect, useCallback, RefObject } from 'react';

/**
 * Hook that adds Cmd+Enter / Ctrl+Enter keyboard shortcut to submit a form.
 * @param formRef - Optional ref to a specific form element. If not provided, 
 *                  finds the closest form from the event target.
 * @param onSubmit - Optional callback to invoke instead of native form submission.
 * @param enabled - Whether the shortcut is active (default: true).
 */
export function useKeyboardSubmit(
    formRef?: RefObject<HTMLFormElement | null>,
    onSubmit?: () => void,
    enabled: boolean = true
) {
    const handleKeyDown = useCallback(
        (e: KeyboardEvent) => {
            if (!enabled) return;
            if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();

                if (onSubmit) {
                    onSubmit();
                    return;
                }

                const form = formRef?.current
                    ?? (e.target as HTMLElement)?.closest('form');

                if (form) {
                    form.requestSubmit();
                }
            }
        },
        [enabled, formRef, onSubmit]
    );

    useEffect(() => {
        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [handleKeyDown]);
}
