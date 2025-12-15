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

  queries.forEach((q) => {
    const item = document.createElement("li");
    item.className = "csr-item";
    // Add a copy button or just text
    item.textContent = q;
    item.title = "Click to copy";
    item.onclick = () => {
      navigator.clipboard.writeText(q);
      item.classList.add("csr-copied");
      setTimeout(() => item.classList.remove("csr-copied"), 1000);
    };
    list.appendChild(item);
  });

  contentDiv.appendChild(list);
}
