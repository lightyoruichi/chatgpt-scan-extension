import './styles.css';
import { InterceptedMessage } from './platforms/types';

console.log("%c[AI Search Revealer Premium UI]", "color: #00f2fe; font-weight: bold; font-size: 14px;", "Active");

// State Management
let isCollapsed = false;
let capturedQueries: { text: string; platform?: string; timestamp: number }[] = [];

// Listen for messages from the Main World
window.addEventListener("message", (event: MessageEvent) => {
    if (event.source !== window) return;
    const data = event.data as Partial<InterceptedMessage>;

    if (data.type === "AI_SEARCH_REVEALER_FOUND" && Array.isArray(data.queries)) {
        // Add new queries with platform context
        data.queries.forEach(q => {
            if (!capturedQueries.some(item => item.text === q)) {
                capturedQueries.unshift({
                    text: q,
                    platform: data.platform,
                    timestamp: Date.now()
                });
            }
        });

        renderUI();

        // Update Extension Badge
        chrome.runtime.sendMessage({
            type: "UPDATE_BADGE",
            count: capturedQueries.length
        }).catch(() => { });
    }
});

function renderUI(): void {
    let container = document.getElementById("csr-root") as HTMLDivElement | null;

    if (!container) {
        container = document.createElement("div");
        container.id = "csr-root";
        container.className = "csr-container csr-fade-in";
        document.body.appendChild(container);

        // Allow clicking the collapsed bubble to expand
        container.onclick = () => {
            if (isCollapsed) {
                isCollapsed = false;
                renderUI();
            }
        };
    }

    if (isCollapsed) {
        container.classList.add("collapsed");
        container.innerHTML = `<div class="csr-live-dot" style="width:12px; height:12px;"></div>`;
        return;
    }

    container.classList.remove("collapsed");
    container.onclick = null;

    // Build Premium Header
    container.innerHTML = `
        <div class="csr-header">
            <div class="csr-title-group">
                <div class="csr-title">
                    <div class="csr-live-dot"></div>
                    AI SEARCH REVEALER
                </div>
                <a href="https://mimrgrowthlab.com/" target="_blank" class="csr-attribution">by MIMR Growth Lab</a>
            </div>
            <div class="csr-controls">
                <button title="Minimize" class="csr-btn" id="csr-collapse-btn">−</button>
                <button title="Close" class="csr-btn" id="csr-close-btn">&times;</button>
            </div>
        </div>
        <div class="csr-content">
            <ul class="csr-list" id="csr-query-list"></ul>
        </div>
    `;

    // Add list items
    const list = container.querySelector("#csr-query-list") as HTMLUListElement;
    capturedQueries.forEach(item => {
        const li = document.createElement("li");
        li.className = "csr-item";

        const platformClass = `platform-${(item.platform || 'unknown').toLowerCase()}`;
        const encodedQ = encodeURIComponent(item.text);

        li.innerHTML = `
            <div class="csr-item-header">
                <span class="csr-platform-tag ${platformClass}">${item.platform || 'QUERY'}</span>
                <div class="csr-tools">
                    <a href="https://www.google.com/search?q=${encodedQ}" target="_blank" class="csr-tool-link" title="Verify on Google">🔎</a>
                    <a href="https://trends.google.com/trends/explore?q=${encodedQ}" target="_blank" class="csr-tool-link" title="Trends">📈</a>
                    <a href="https://answerthepublic.com/?q=${encodedQ}" target="_blank" class="csr-tool-link" title="Deep Insights">🧠</a>
                </div>
            </div>
            <div class="csr-query-text">${item.text}</div>
            <div class="csr-copy-hint">Click text to copy</div>
        `;

        // Copy functionality
        const textEl = li.querySelector(".csr-query-text") as HTMLDivElement;
        textEl.onclick = () => {
            navigator.clipboard.writeText(item.text).then(() => {
                const hint = li.querySelector(".csr-copy-hint") as HTMLDivElement;
                hint.textContent = "COPIED!";
                hint.style.color = "#10a37f";
                setTimeout(() => {
                    hint.textContent = "Click text to copy";
                    hint.style.color = "";
                }, 2000);
            });
        };

        list.appendChild(li);
    });

    // Event Listeners for controls
    document.getElementById("csr-collapse-btn")!.onclick = (e) => {
        e.stopPropagation();
        isCollapsed = true;
        renderUI();
    };

    document.getElementById("csr-close-btn")!.onclick = (e) => {
        e.stopPropagation();
        container?.remove();
    };
}
