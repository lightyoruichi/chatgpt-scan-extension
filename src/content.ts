import './styles.css';
import { InterceptedMessage } from './platforms/types';
import { createUiController } from './ui/controller';

console.log("%c[AI Search Revealer Premium UI]", "color: #00f2fe; font-weight: bold; font-size: 14px;", "Active");

const ui = createUiController({
    doc: document,
    win: window,
    sendBadgeUpdate: (count) => chrome.runtime.sendMessage({ type: "UPDATE_BADGE", count }).catch(() => { }),
});

// Listen for messages from the Main World
window.addEventListener("message", (event: MessageEvent) => {
    if (event.source !== window) return;
    const data = event.data as Partial<InterceptedMessage>;
    ui.handleInterceptedMessage(data);
});

// Render immediately so reviewers/users see the UI without waiting for network activity.
ui.render();
