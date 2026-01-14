import { describe, expect, it } from "vitest";
import { ChatGPTContext } from "./chatgpt";

describe("ChatGPTContext.extractQueries", () => {
    it("extracts queries from SSE metadata.search_model_queries", () => {
        const text = [
            'data: {"message":{"metadata":{"search_model_queries":["alpha","beta"]}}}',
            "data: [DONE]",
        ].join("\n");

        const queries = ChatGPTContext.extractQueries(text);
        expect(queries).toEqual(expect.arrayContaining(["alpha", "beta"]));
    });

    it("extracts queries from tool_calls google_search arguments", () => {
        const text = [
            'data: {"message":{"content":{"parts":[{"tool_calls":[{"name":"google_search","arguments":{"query":"best pizza nyc"}}]}]}}}',
            "data: [DONE]",
        ].join("\n");

        const queries = ChatGPTContext.extractQueries(text);
        expect(queries).toEqual(["best pizza nyc"]);
    });

    it("falls back to regex parsing for legacy search_model_queries payloads", () => {
        const text =
            '{"search_model_queries":{"queries":["one","two"]},"other":"x"}';

        const queries = ChatGPTContext.extractQueries(text);
        expect(queries).toEqual(expect.arrayContaining(["one", "two"]));
    });
});

