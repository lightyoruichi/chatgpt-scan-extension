console.log("[ChatGPT Revealer] UI Content Script Loaded");

// Listen for messages from the Main World
window.addEventListener("message", (event) => {
  // We only accept messages from ourselves
  if (event.source !== window) return;

  if (event.data.type && event.data.type === "CHATGPT_SEARCH_REVEALER_FOUND") {
    console.log("[ChatGPT Revealer] UI received queries:", event.data.queries);
    showOverlay(event.data.queries);
  }
});

function showOverlay(queries) {
  let container = document.getElementById("chatgpt-search-revealer-container");

  if (!container) {
    console.log("[ChatGPT Revealer] Creating new overlay...");
    container = document.createElement("div");
    container.id = "chatgpt-search-revealer-container";
    container.className = "csr-container csr-fade-in";

    // Header
    const header = document.createElement("div");
    header.className = "csr-header";

    const title = document.createElement("span");
    title.className = "csr-title";
    title.innerHTML = "🔍 Search Queries";

    const closeBtn = document.createElement("button");
    closeBtn.className = "csr-close-btn";
    closeBtn.innerHTML = "&times;";
    closeBtn.onclick = () => {
      container.remove();
    };

    header.appendChild(title);
    header.appendChild(closeBtn);
    container.appendChild(header);

    // Content
    const content = document.createElement("div");
    content.className = "csr-content";
    container.appendChild(content);

    document.body.appendChild(container); // Inject into body
    console.log("[ChatGPT Revealer] Overlay attached to body.");
  } else {
    console.log("[ChatGPT Revealer] Updating existing overlay.");
  }

  // Update content
  const contentDiv = container.querySelector(".csr-content");
  contentDiv.innerHTML = ""; // Clear old

  const list = document.createElement("ul");
  list.className = "csr-list";

  queries.forEach(q => {
    const item = document.createElement('li');
    item.className = 'csr-item';

    // Main text container
    const textSpan = document.createElement('span');
    textSpan.className = 'csr-query-text';
    textSpan.textContent = q;
    textSpan.title = "Click to copy";
    textSpan.onclick = () => {
      navigator.clipboard.writeText(q);
      textSpan.classList.add('csr-text-copied');
      setTimeout(() => textSpan.classList.remove('csr-text-copied'), 1000);
    };

    // Tools container
    const toolsDiv = document.createElement('div');
    toolsDiv.className = 'csr-tools';

    // Helper to create tool links
    const createToolLink = (emoji, url, title) => {
      const a = document.createElement('a');
      a.href = url;
      a.target = '_blank';
      a.className = 'csr-tool-btn';
      a.title = title;
      a.innerHTML = emoji;
      return a;
    };

    const encodedQ = encodeURIComponent(q);

    // 1. Google Search
    toolsDiv.appendChild(createToolLink('🔎', `https://www.google.com/search?q=${encodedQ}`, 'Search on Google'));

    // 2. Google Trends
    toolsDiv.appendChild(createToolLink('📈', `https://trends.google.com/trends/explore?q=${encodedQ}`, 'Check Google Trends'));

    // 3. AnswerThePublic (Direct link as requested/implied)
    // ATP doesn't have a simple GET param for search results that persists cleanly without redirection/setup often,
    // but we can try to link to the home page or a search structure if known.
    // Linking to homepage is safest based on "https://answerthepublic.com/ link".
    toolsDiv.appendChild(createToolLink('🧠', `https://answerthepublic.com/?q=${encodedQ}`, 'AnswerThePublic'));

    item.appendChild(textSpan);
    item.appendChild(toolsDiv);
    list.appendChild(item);
  });

  contentDiv.appendChild(list);
}
