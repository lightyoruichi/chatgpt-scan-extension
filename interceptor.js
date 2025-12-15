(function () {
  const originalFetch = window.fetch;

  window.fetch = function (...args) {
    // 1. Extract URL to decide if we need to intercept
    const resource = args[0];
    let url = "";

    if (typeof resource === "string") {
      url = resource;
    } else if (resource instanceof Request) {
      url = resource.url;
    } else if (resource && resource.toString) {
      url = resource.toString();
    }

    // 2. Optimization & Noise/Error Suppression
    // If it's a known tracking domain that often gets blocked by adblockers (causing console spam),
    // we just return a dummy 200 OK response. This keeps the console clean.
    if (url && (url.includes("ab.chatgpt.com") || url.includes("statsig"))) {
      return Promise.resolve(new Response(null, { status: 200 }));
    }

    // 3. Pass-through for non-conversation endpoints
    if (
      !url ||
      !(
        url.includes("/backend-api/conversation") ||
        url.includes("/backend-api/lat/r")
      )
    ) {
      return originalFetch.apply(this, args);
    }

    // 4. For conversation endpoints, we attach our logic.
    return originalFetch.apply(this, args).then((response) => {
      // Clone immediately before anyone else reads the stream
      const clone = response.clone();

      // Process asynchronously
      clone
        .text()
        .then((text) => {
          // console.log('[ChatGPT Revealer] intercepted text length:', text.length);

          try {
            // ChatGPT responses are often Server-Sent Events (SSE), where each line starts with "data: "
            // The naive regex on the whole text fails if the json is split or formatted unexpectedly.
            // We should split by newline and parse each "data: " line.

            const lines = text.split("\n");
            let foundQueries = null;

            for (const line of lines) {
              if (line.trim().startsWith("data: ")) {
                const jsonStr = line.substring(6).trim(); // Remove "data: "
                if (jsonStr === "[DONE]") continue;

                try {
                  // Optimistic check: only parse if it looks like it has our key
                  if (jsonStr.includes("search_model_queries")) {
                    const data = JSON.parse(jsonStr);
                    // Deep extraction function
                    // The path is usually message.metadata.search_model_queries
                    const queries =
                      data?.message?.metadata?.search_model_queries;

                    if (Array.isArray(queries) && queries.length > 0) {
                      foundQueries = queries;
                      break; // Found it, stop parsing
                    }
                  }
                } catch (e) {
                  // ignore parse errors for intermediate chunks
                }
              }
            }

            if (foundQueries) {
              console.log(
                "[ChatGPT Revealer] Found queries (SSE mode):",
                foundQueries,
              );
              window.postMessage(
                {
                  type: "CHATGPT_SEARCH_REVEALER_FOUND",
                  queries: foundQueries,
                },
                "*",
              );
            } else {
              console.log(
                "[ChatGPT Revealer] SSE parsing failed to find queries.",
              );

              // Fallback & Debugging
              if (text.includes("search_model_queries")) {
                // Based on logs: "search_model_queries":{"type":"search_model_queries","queries":["..."]}
                // We need to look inside the object for the "queries" array.

                // Regex: "search_model_queries" : { ... "queries" : [ ... ]
                const regex =
                  /"search_model_queries"\s*:\s*\{[^}]*?"queries"\s*:\s*(\[[^\]]+\])/;

                const match = text.match(regex);
                if (match && match[1]) {
                  try {
                    const queries = JSON.parse(match[1]);
                    if (Array.isArray(queries) && queries.length > 0) {
                      console.log(
                        "[ChatGPT Revealer] Found queries (Regex mode):",
                        queries,
                      );
                      window.postMessage(
                        {
                          type: "CHATGPT_SEARCH_REVEALER_FOUND",
                          queries: queries,
                        },
                        "*",
                      );
                    }
                  } catch (e) {
                    console.warn(
                      "[ChatGPT Revealer] Regex matched but JSON parse failed:",
                      e,
                    );
                  }
                } else {
                  console.warn("[ChatGPT Revealer] Regex failed on snippet.");
                }
              }
            }
          } catch (e) {
            console.error("[ChatGPT Revealer] Parse error:", e);
          }
        })
        .catch((err) => {
          console.debug("[ChatGPT Revealer] Error reading response text:", err);
        });

      return response;
    });
  };

  console.log("[ChatGPT Revealer] Interceptor Loaded");
})();
