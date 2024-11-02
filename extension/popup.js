document.addEventListener("DOMContentLoaded", function() {
    // Get current tab URL
    chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
        document.getElementById("url").textContent = `Current URL: ${tabs[0].url}`;
    });

    document
        .getElementById("startButton")
        .addEventListener("click", async function() {
            const summaryDiv = document.getElementById("summary");
            summaryDiv.textContent = "Analyzing page...";

            try {
                // Get API key from storage
                const { apiKey } = await chrome.storage.sync.get("apiKey");
                if (!apiKey) {
                    throw new Error(
                        "Please set your OpenAI API key in the extension options"
                    );
                }

                // Get current tab
                const [tab] = await chrome.tabs.query({
                    active: true,
                    currentWindow: true,
                });

                // Execute script to get page content
                const [{ result }] = await chrome.scripting.executeScript({
                    target: { tabId: tab.id },
                    func: () => {
                        // Clean and get the main content
                        const content = document.body.innerText;
                        // Limit content length to avoid token limits
                        return content.slice(0, 4000);
                    },
                });

                // Call OpenAI API
                const openaiResponse = await fetch(
                    "https://api.openai.com/v1/chat/completions", {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                            Authorization: `Bearer ${apiKey}`,
                        },
                        body: JSON.stringify({
                            model: "gpt-3.5-turbo",
                            messages: [{
                                role: "user",
                                content: `Please summarize the following webpage content in 3-4 sentences: ${result}`,
                            }, ],
                        }),
                    }
                );

                const data = await openaiResponse.json();
                if (data.error) {
                    throw new Error(data.error.message);
                }
                summaryDiv.textContent = data.choices[0].message.content;
            } catch (error) {
                summaryDiv.textContent = `Error: ${error.message}`;
                summaryDiv.classList.add("error");
            }
        });
});