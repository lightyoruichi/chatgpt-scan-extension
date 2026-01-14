import { describe, expect, it } from "vitest";
import { createUiController } from "./controller";

describe("UI controller", () => {
    it("renders a collapsed bubble immediately", () => {
        const ui = createUiController({
            doc: document,
            win: window,
        });

        ui.render();
        const root = document.getElementById("csr-root");
        expect(root).toBeTruthy();
        expect(root?.classList.contains("collapsed")).toBe(true);
    });

    it("auto-expands on first captured query and does not inject HTML", () => {
        const ui = createUiController({
            doc: document,
            win: window,
        });

        ui.render();
        ui.handleInterceptedMessage({
            type: "AI_SEARCH_REVEALER_FOUND",
            platform: "ChatGPT",
            queries: ['<img src=x onerror="alert(1)">hello'],
        });

        const root = document.getElementById("csr-root")!;
        expect(root.classList.contains("collapsed")).toBe(false);

        const textEl = root.querySelector(".csr-query-text");
        expect(textEl?.textContent).toContain('<img src=x onerror="alert(1)">hello');

        // Ensure no HTML nodes were injected into the query body.
        const injectedImg = root.querySelector(".csr-query-text img");
        expect(injectedImg).toBeNull();
    });
});

