import { useEffect, useRef, useState } from "react";

interface EventSourceOptions {
    enabled?: boolean;
    onMessage?: (event: MessageEvent) => void;
    onError?: (error: Event) => void;
    onOpen?: (event: Event) => void;
}

export function useEventSource(url: string, options: EventSourceOptions = {}) {
    const { enabled = true, onMessage, onError, onOpen } = options;
    const [data, setData] = useState<any>(null);
    const [error, setError] = useState<Error | null>(null);
    const eventSourceRef = useRef<EventSource | null>(null);

    useEffect(() => {
        if (!enabled) return;

        const eventSource = new EventSource(url);
        eventSourceRef.current = eventSource;

        eventSource.onmessage = (event) => {
            try {
                const parsedData = JSON.parse(event.data);
                setData(parsedData);
                onMessage?.(event);
            } catch (err) {
                setError(err instanceof Error ? err : new Error("Failed to parse event data"));
            }
        };

        eventSource.onerror = (event) => {
            setError(new Error("EventSource failed"));
            onError?.(event);
        };

        eventSource.onopen = (event) => {
            onOpen?.(event);
        };

        return () => {
            eventSource.close();
            eventSourceRef.current = null;
        };
    }, [url, enabled, onMessage, onError, onOpen]);

    return { data, error };
} 