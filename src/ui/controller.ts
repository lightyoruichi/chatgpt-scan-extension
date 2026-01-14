import type { InterceptedMessage } from "../platforms/types";

export type CapturedQuery = { text: string; platform?: string; timestamp: number };

export interface UiControllerDeps {
    doc: Document;
    win: Window;
    /**
     * Optional hook used by the extension runtime to update the badge.
     * In tests this can be omitted.
     */
    sendBadgeUpdate?: (count: number) => Promise<unknown> | void;
}

export interface UiController {
    render: () => void;
    handleInterceptedMessage: (message: Partial<InterceptedMessage>) => void;
    getState: () => { isCollapsed: boolean; capturedQueries: CapturedQuery[] };
}

export function createUiController(deps: UiControllerDeps): UiController {
    let isCollapsed = true;
    const capturedQueries: CapturedQuery[] = [];

    const ensureRoot = (): HTMLDivElement => {
        let container = deps.doc.getElementById("csr-root") as HTMLDivElement | null;
        if (container) return container;

        container = deps.doc.createElement("div");
        container.id = "csr-root";
        container.className = "csr-container csr-fade-in";
        container.setAttribute("data-csr-root", "true");

        // Mount ASAP, even before <body> exists (document_start).
        const mountTarget = deps.doc.body ?? deps.doc.documentElement;
        mountTarget.appendChild(container);

        // If we mounted to <html>, move to <body> once it exists.
        if (!deps.doc.body && typeof MutationObserver !== "undefined") {
            const mo = new MutationObserver(() => {
                if (deps.doc.body && container && container.parentElement !== deps.doc.body) {
                    deps.doc.body.appendChild(container);
                    mo.disconnect();
                }
            });
            mo.observe(deps.doc.documentElement, { childList: true, subtree: true });
        }

        // Allow clicking the collapsed bubble to expand
        container.addEventListener("click", () => {
            if (isCollapsed) {
                isCollapsed = false;
                renderUI();
            }
        });

        // Keyboard support when collapsed
        container.addEventListener("keydown", (e) => {
            if (!isCollapsed) return;
            if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                isCollapsed = false;
                renderUI();
            }
        });

        return container;
    };

    const renderUI = (): void => {
        const container = ensureRoot();

        if (isCollapsed) {
            container.classList.add("collapsed");
            container.setAttribute("role", "button");
            container.setAttribute("tabindex", "0");
            container.setAttribute("aria-label", "Open AI Search Revealer");
            container.innerHTML = "";
            const dot = deps.doc.createElement("div");
            dot.className = "csr-live-dot";
            dot.style.width = "12px";
            dot.style.height = "12px";
            container.appendChild(dot);
            return;
        }

        container.classList.remove("collapsed");
        container.removeAttribute("role");
        container.removeAttribute("tabindex");
        container.removeAttribute("aria-label");

        // Static shell (safe: no untrusted interpolation)
        container.innerHTML = `
            <div class="csr-header">
                <div class="csr-title-group">
                    <div class="csr-title">
                        <div class="csr-live-dot" aria-hidden="true"></div>
                        AI SEARCH REVEALER
                    </div>
                    <a href="https://mimrgrowthlab.com/" target="_blank" rel="noreferrer" class="csr-attribution">by MIMR Growth Lab</a>
                </div>
                <div class="csr-controls">
                    <button type="button" aria-label="Minimize" title="Minimize" class="csr-btn" id="csr-collapse-btn">−</button>
                    <button type="button" aria-label="Close" title="Close" class="csr-btn" id="csr-close-btn">&times;</button>
                </div>
            </div>
            <div class="csr-content">
                <ul class="csr-list" id="csr-query-list"></ul>
            </div>
        `;

        const list = container.querySelector("#csr-query-list") as HTMLUListElement;
        if (capturedQueries.length === 0) {
            const li = deps.doc.createElement("li");
            li.className = "csr-item csr-empty";
            const title = deps.doc.createElement("div");
            title.className = "csr-query-text";
            title.textContent = "No searches captured yet.";
            const hint = deps.doc.createElement("div");
            hint.className = "csr-copy-hint";
            hint.textContent = "Ask a question that triggers web search to see queries here.";
            hint.style.opacity = "0.7";
            li.appendChild(title);
            li.appendChild(hint);
            list.appendChild(li);
        } else {
            capturedQueries.forEach(item => {
                const li = deps.doc.createElement("li");
                li.className = "csr-item";

                const header = deps.doc.createElement("div");
                header.className = "csr-item-header";

                const tag = deps.doc.createElement("span");
                const platformClass = `platform-${(item.platform || "unknown").toLowerCase()}`;
                tag.className = `csr-platform-tag ${platformClass}`;
                tag.textContent = item.platform || "QUERY";

                const tools = deps.doc.createElement("div");
                tools.className = "csr-tools";

                const encodedQ = encodeURIComponent(item.text);
                const mkTool = (href: string, title: string, label: string) => {
                    const a = deps.doc.createElement("a");
                    a.className = "csr-tool-link";
                    a.href = href;
                    a.target = "_blank";
                    a.rel = "noreferrer";
                    a.title = title;
                    a.setAttribute("aria-label", title);
                    a.textContent = label;
                    return a;
                };
                tools.appendChild(mkTool(`https://www.google.com/search?q=${encodedQ}`, "Verify on Google", "🔎"));
                tools.appendChild(mkTool(`https://trends.google.com/trends/explore?q=${encodedQ}`, "Trends", "📈"));
                tools.appendChild(mkTool(`https://answerthepublic.com/?q=${encodedQ}`, "Deep Insights", "🧠"));

                header.appendChild(tag);
                header.appendChild(tools);

                const textEl = deps.doc.createElement("div");
                textEl.className = "csr-query-text";
                textEl.textContent = item.text;

                const hint = deps.doc.createElement("div");
                hint.className = "csr-copy-hint";
                hint.textContent = "Click text to copy";

                textEl.addEventListener("click", () => {
                    // Clipboard isn’t available in unit tests; ignore failures.
                    deps.win.navigator.clipboard?.writeText(item.text).then(() => {
                        hint.textContent = "COPIED!";
                        hint.style.color = "#10a37f";
                        deps.win.setTimeout(() => {
                            hint.textContent = "Click text to copy";
                            hint.style.color = "";
                        }, 2000);
                    }).catch(() => {
                        hint.textContent = "Copy failed";
                        hint.style.color = "#ef4444";
                    });
                });

                li.appendChild(header);
                li.appendChild(textEl);
                li.appendChild(hint);
                list.appendChild(li);
            });
        }

        container.querySelector<HTMLButtonElement>("#csr-collapse-btn")!.onclick = (e) => {
            e.stopPropagation();
            isCollapsed = true;
            renderUI();
        };

        container.querySelector<HTMLButtonElement>("#csr-close-btn")!.onclick = (e) => {
            e.stopPropagation();
            container?.remove();
        };
    };

    const handleInterceptedMessage = (message: Partial<InterceptedMessage>) => {
        if (message.type !== "AI_SEARCH_REVEALER_FOUND" || !Array.isArray(message.queries)) return;

        message.queries.forEach(q => {
            if (!capturedQueries.some(item => item.text === q)) {
                capturedQueries.unshift({
                    text: q,
                    platform: message.platform,
                    timestamp: Date.now()
                });
            }
        });

        // Auto-expand on first capture so the user sees results.
        if (isCollapsed && capturedQueries.length > 0) isCollapsed = false;

        renderUI();
        deps.sendBadgeUpdate?.(capturedQueries.length);
    };

    return {
        render: renderUI,
        handleInterceptedMessage,
        getState: () => ({ isCollapsed, capturedQueries: [...capturedQueries] }),
    };
}

