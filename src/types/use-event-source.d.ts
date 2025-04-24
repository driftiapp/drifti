import { MessageEvent } from "react";

export interface EventSourceOptions {
    enabled?: boolean;
    onMessage?: (event: MessageEvent) => void;
    onError?: (error: Event) => void;
    onOpen?: (event: Event) => void;
}

export function useEventSource(url: string, options?: EventSourceOptions): {
    data: any;
    error: Error | null;
}; 