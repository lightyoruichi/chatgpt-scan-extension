export interface IPlatformExtractor {
    name: string;
    shouldIntercept(url: string): boolean;
    extractQueries(text: string): string[] | null;
}

export interface InterceptedMessage {
    type: "AI_SEARCH_REVEALER_FOUND";
    queries: string[];
    platform?: string;
}
