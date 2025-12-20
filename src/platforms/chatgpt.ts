import { IPlatformExtractor } from "./types";

export const ChatGPTContext: IPlatformExtractor = {
    name: "ChatGPT",
    shouldIntercept(url: string): boolean {
        return (
            url.includes("/backend-api/conversation") ||
            url.includes("/backend-api/lat/r")
        );
    },
    extractQueries(text: string): string[] | null {
        const queries = new Set<string>();
        const lines = text.split("\n");

        for (const line of lines) {
            const trimmedLine = line.trim();
            if (trimmedLine.startsWith("data: ")) {
                try {
                    const content = trimmedLine.slice(6).trim();
                    if (content === "[DONE]") continue;

                    const data = JSON.parse(content);
                    const message = data?.message;
                    const metadata = message?.metadata;

                    // NEW: Check tool_calls in message content (SearchGPT pattern)
                    const toolCalls = message?.content?.parts?.[0]?.tool_calls;
                    if (Array.isArray(toolCalls)) {
                        toolCalls.forEach((tc: any) => {
                            if (tc?.name === "google_search" && tc?.arguments?.query) {
                                queries.add(tc.arguments.query);
                            }
                        });
                    }

                    // Priority 1: Official search_model_queries
                    const searchQueries = metadata?.search_model_queries;
                    if (Array.isArray(searchQueries)) {
                        searchQueries.forEach((q: unknown) => {
                            if (typeof q === "string") queries.add(q);
                        });
                    }

                    // Priority 2: Fallback to tool_uses
                    const toolUses = metadata?.tool_uses;
                    if (Array.isArray(toolUses)) {
                        toolUses.forEach((tool: any) => {
                            const name = tool?.name;
                            if (name === "google_search" || name === "search" || name === "web_search") {
                                if (tool?.arguments) {
                                    try {
                                        const args = typeof tool.arguments === 'string' ? JSON.parse(tool.arguments) : tool.arguments;
                                        if (args.query) queries.add(args.query);
                                    } catch (e) { }
                                }
                            }
                        });
                    }

                    // Priority 3: Adaptive check for any key containing 'query' inside metadata
                    if (metadata) {
                        Object.keys(metadata).forEach(key => {
                            if (key.toLowerCase().includes("query") && Array.isArray(metadata[key])) {
                                metadata[key].forEach((q: any) => {
                                    if (typeof q === "string") queries.add(q);
                                });
                            }
                        });
                    }
                } catch (e) {
                    // Ignore parse errors for partial chunks
                }
            } else if (trimmedLine.length > 20 && trimmedLine.startsWith("{")) {
                // Non-SSE fallback (e.g. initialization JSON)
                try {
                    const data = JSON.parse(trimmedLine);
                    const metadata = data?.message?.metadata || data?.metadata;
                    if (metadata?.search_model_queries) {
                        if (Array.isArray(metadata.search_model_queries)) {
                            metadata.search_model_queries.forEach((q: any) => {
                                if (typeof q === 'string') queries.add(q);
                            });
                        }
                    }
                    // Also check tool calls in this JSON
                    const toolCalls = data?.message?.content?.parts?.[0]?.tool_calls;
                    if (Array.isArray(toolCalls)) {
                        toolCalls.forEach((tc: any) => {
                            if (tc?.name === "google_search" && tc?.arguments?.query) {
                                queries.add(tc.arguments.query);
                            }
                        });
                    }
                } catch (e) { }
            }
        }

        // --- REGEX FALLBACK (From Legacy) ---
        if (queries.size === 0 && text.includes("search_model_queries")) {
            const regex = /"search_model_queries"\s*:\s*\{[^}]*?"queries"\s*:\s*(\[[^\]]+\])/;
            const match = text.match(regex);
            if (match?.[1]) {
                try {
                    const parsed = JSON.parse(match[1]);
                    if (Array.isArray(parsed)) {
                        parsed.forEach(q => { if (typeof q === 'string') queries.add(q); });
                    }
                } catch (e) { }
            }
        }

        // Generic tool call fallback regex
        if (queries.size === 0 && text.includes("google_search")) {
            const toolRegex = /"name"\s*:\s*"google_search"[^}]*"arguments"\s*:\s*"(\{.*?\})"/g;
            let m;
            while ((m = toolRegex.exec(text)) !== null) {
                try {
                    const args = JSON.parse(m[1].replace(/\\"/g, '"').replace(/\\\\/g, '\\'));
                    if (args.query) queries.add(args.query);
                } catch (e) { }
            }
        }

        return queries.size > 0 ? Array.from(queries) : null;
    },
};
