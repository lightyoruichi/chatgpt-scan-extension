console.log("%c[AI Search Revealer Premium UI]","color: #00f2fe; font-weight: bold; font-size: 14px;","Active");let n=!1,i=[];window.addEventListener("message",e=>{if(e.source!==window)return;const o=e.data;o.type==="AI_SEARCH_REVEALER_FOUND"&&Array.isArray(o.queries)&&(o.queries.forEach(t=>{i.some(s=>s.text===t)||i.unshift({text:t,platform:o.platform,timestamp:Date.now()})}),a(),chrome.runtime.sendMessage({type:"UPDATE_BADGE",count:i.length}).catch(()=>{})),o.type==="INTERCEPTOR_READY"&&chrome.runtime.sendMessage({type:"INTERCEPTOR_READY"}).catch(()=>{})});chrome.runtime.onMessage.addListener((e,o,t)=>{if(e.type==="PING_INTERCEPTOR"){window.postMessage({type:"PING_INTERCEPTOR"},"*");const s=c=>{var r;c.source===window&&((r=c.data)==null?void 0:r.type)==="INTERCEPTOR_READY"&&(window.removeEventListener("message",s),t({ready:!0}))};return window.addEventListener("message",s),setTimeout(()=>{window.removeEventListener("message",s),t({ready:!1})},500),!0}return!1});function a(){let e=document.getElementById("csr-root");if(e||(e=document.createElement("div"),e.id="csr-root",e.className="csr-container csr-fade-in",document.body.appendChild(e),e.onclick=()=>{n&&(n=!1,a())}),n){e.classList.add("collapsed"),e.innerHTML='<div class="csr-live-dot" style="width:12px; height:12px;"></div>';return}e.classList.remove("collapsed"),e.onclick=null,e.innerHTML=`
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
    `;const o=e.querySelector("#csr-query-list");i.forEach(t=>{const s=document.createElement("li");s.className="csr-item";const c=`platform-${(t.platform||"unknown").toLowerCase()}`,r=encodeURIComponent(t.text);s.innerHTML=`
            <div class="csr-item-header">
                <span class="csr-platform-tag ${c}">${t.platform||"QUERY"}</span>
                <div class="csr-tools">
                    <a href="https://www.google.com/search?q=${r}" target="_blank" class="csr-tool-link" title="Verify on Google">🔎</a>
                    <a href="https://trends.google.com/trends/explore?q=${r}" target="_blank" class="csr-tool-link" title="Trends">📈</a>
                    <a href="https://answerthepublic.com/?q=${r}" target="_blank" class="csr-tool-link" title="Deep Insights">🧠</a>
                </div>
            </div>
            <div class="csr-query-text">${t.text}</div>
            <div class="csr-copy-hint">Click text to copy</div>
        `;const d=s.querySelector(".csr-query-text");d.onclick=()=>{navigator.clipboard.writeText(t.text).then(()=>{const l=s.querySelector(".csr-copy-hint");l.textContent="COPIED!",l.style.color="#10a37f",setTimeout(()=>{l.textContent="Click text to copy",l.style.color=""},2e3)})},o.appendChild(s)}),document.getElementById("csr-collapse-btn").onclick=t=>{t.stopPropagation(),n=!0,a()},document.getElementById("csr-close-btn").onclick=t=>{t.stopPropagation(),e==null||e.remove()}}
