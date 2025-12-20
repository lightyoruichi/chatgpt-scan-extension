import { ChatGPTContext } from "./platforms/chatgpt";
import { ClaudeContext } from "./platforms/claude";
import { PerplexityContext } from "./platforms/perplexity";
import { GeminiContext } from "./platforms/gemini";
import { IPlatformExtractor, InterceptedMessage } from "./platforms/types";

(() => {
    const PLATFORMS: IPlatformExtractor[] = [
        ChatGPTContext,
        ClaudeContext,
        PerplexityContext,
        GeminiContext,
    ];

    const log = (...args: unknown[]) => {
        console.log("%c[AI Search Revealer Interceptor]", "color: #00f2fe; font-weight: bold; font-size: 12px;", ...args);
    };

    log("Initializing...");

    const notifyUI = (queries: string[], platform?: string) => {
        if (queries.length === 0) return;
        log(`Found queries for ${platform || 'Unknown'}:`, queries);
        const message: InterceptedMessage = {
            type: "AI_SEARCH_REVEALER_FOUND",
            queries,
            platform
        };
        window.postMessage(message, "*");
    };

    // --- window.fetch Override ---
    const originalFetch = window.fetch;
    window.fetch = function (input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
        const url = typeof input === "string" ? input : (input instanceof URL ? input.toString() : input.url);

        // Noise suppression for tracking domains (prevents ERR_BLOCKED_BY_CLIENT console spam)
        const BLOCKED_DOMAINS = ["ab.chatgpt.com", "statsig", "googletagmanager.com", "google-analytics.com", "play.google.com/log", "google.com/ccm/collect"];
        if (url && BLOCKED_DOMAINS.some(domain => url.includes(domain))) {
            return Promise.resolve(new Response(null, { status: 200 }));
        }

        const platform = PLATFORMS.find((p) => {
            try {
                return p.shouldIntercept(url);
            } catch (e) { return false; }
        });

        if (platform) {
            // log(`MATCHED ${platform.name} -> ${url}`);
        }

        // Standard fetch call - avoiding 'this' binding issues globally
        const promise = originalFetch.apply(window, [input, init]);

        if (platform) {
            promise.then(async (response) => {
                if (!response.ok) {
                    log(`Response code ${response.status} for ${platform.name}`);
                    return;
                }
                try {
                    const clone = response.clone();
                    const text = await clone.text();
                    log(`Processing ${text.length} bytes for ${platform.name}`);
                    const queries = platform.extractQueries(text);
                    if (queries && queries.length > 0) notifyUI(queries, platform.name);
                } catch (e) {
                    log("Error processing:", e);
                }
            }).catch((e) => {
                log("Fetch promise rejected:", e);
            });
        }

        return promise;
    };

    // --- window.EventSource Override ---
    const OriginalEventSource = window.EventSource;
    if (OriginalEventSource) {
        // @ts-expect-error - Monkey-patching global EventSource
        window.EventSource = function (
            this: EventSource,
            url: string | URL,
            eventSourceInitDict?: EventSourceInit
        ): EventSource {
            log("EventSource created for:", url);
            const es = new OriginalEventSource(url, eventSourceInitDict);
            const platform = PLATFORMS.find((p) => p.shouldIntercept(url.toString()));

            if (platform) {
                es.addEventListener("message", (event) => {
                    const queries = platform.extractQueries(`data: ${event.data}`);
                    if (queries) notifyUI(queries, platform.name);
                });
            }
            return es;
        };

        // Maintain static properties and prototype
        Object.setPrototypeOf(window.EventSource, OriginalEventSource);
        window.EventSource.prototype = OriginalEventSource.prototype;
        // @ts-ignore
        (window.EventSource as unknown as typeof OriginalEventSource).CONNECTING = OriginalEventSource.CONNECTING;
        // @ts-ignore
        (window.EventSource as unknown as typeof OriginalEventSource).OPEN = OriginalEventSource.OPEN;
        // @ts-ignore
        (window.EventSource as unknown as typeof OriginalEventSource).CLOSED = OriginalEventSource.CLOSED;
    }

    // --- window.XMLHttpRequest Override ---
    const OriginalXMLHttpRequest = window.XMLHttpRequest;
    if (OriginalXMLHttpRequest) {
        // @ts-expect-error - Monkey-patching global XMLHttpRequest
        window.XMLHttpRequest = function (this: XMLHttpRequest): XMLHttpRequest {
            const xhr = new OriginalXMLHttpRequest();
            let requestUrl: string | null = null;

            const originalOpen = xhr.open;
            xhr.open = function (this: XMLHttpRequest, ...args: any[]) {
                requestUrl = args[1];
                return originalOpen.apply(this, args as any);
            };

            const handleResponse = () => {
                if (xhr.readyState === 4 && requestUrl) {
                    const platform = PLATFORMS.find((p) => p.shouldIntercept(requestUrl!));
                    if (platform && xhr.responseText) {
                        const queries = platform.extractQueries(xhr.responseText);
                        if (queries) notifyUI(queries, platform.name);
                    }
                }
            };

            xhr.addEventListener("readystatechange", handleResponse);
            xhr.addEventListener("load", handleResponse);

            return xhr;
        };

        Object.setPrototypeOf(window.XMLHttpRequest, OriginalXMLHttpRequest);
        window.XMLHttpRequest.prototype = OriginalXMLHttpRequest.prototype;
    }

    log("===== INTERCEPTOR LOADED & READY =====");
})();
