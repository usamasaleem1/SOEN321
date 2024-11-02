chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "getContent") {
        const content = document.body.innerText;
        sendResponse({ content });
    }
    return true;
});