import { describe, expect, it } from "vitest";
import { ChatGPTContext } from "./chatgpt";

describe("ChatGPTContext.extract", () => {
    it("extracts queries from SSE metadata.search_model_queries", () => {
        const text = [
            'data: {"message":{"metadata":{"search_model_queries":["alpha","beta"]}}}',
            "data: [DONE]",
        ].join("\n");

        const nodes = ChatGPTContext.extract(text);
        expect(nodes).toHaveLength(2);
        expect(nodes?.map(n => n.text)).toEqual(expect.arrayContaining(["alpha", "beta"]));
    });

    it("extracts queries from tool_calls google_search arguments", () => {
        const text = [
            'data: {"message":{"content":{"parts":[{"tool_calls":[{"name":"google_search","arguments":{"query":"best pizza nyc"}}]}]}}}',
            "data: [DONE]",
        ].join("\n");

        const nodes = ChatGPTContext.extract(text);
        expect(nodes).toHaveLength(1);
        expect(nodes?.[0].text).toBe("best pizza nyc");
    });

    it("falls back to regex parsing for legacy search_model_queries payloads", () => {
        const text =
            '{"search_model_queries":{"queries":["one","two"]},"other":"x"}';

        const nodes = ChatGPTContext.extract(text);
        expect(nodes).toHaveLength(2);
        expect(nodes?.map(n => n.text)).toEqual(expect.arrayContaining(["one", "two"]));
    });
    it("extracts sources from metadata.citations", () => {



        // Note: citations might be attached to a specific query or global. 
        // For now, if we find citations but no explicit query in the same chunk, 
        // we might verify they are returned if we can simulate a query availability or attach to a placeholder.
        // But typically citations come WITH the query or shortly after.
        // Let's assume a query is present for the test to pass the "found query" check

        const textWithQuery = [
            'data: {"message":{"metadata":{"search_model_queries":["query1"],"citations":[{"url":"https://test.com","title":"Test Title"}]}}}',
        ].join("\n");

        const nodes2 = ChatGPTContext.extract(textWithQuery);
        expect(nodes2).toHaveLength(1);
        expect(nodes2?.[0].sources).toHaveLength(1);
        expect(nodes2?.[0].sources?.[0].url).toBe("https://test.com");
    });
});

