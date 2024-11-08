document.addEventListener("DOMContentLoaded", function () {
    // Get current tab URL
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
        document.getElementById("url").textContent = `Current URL: ${tabs[0].url}`;
    });

    async function checkForAgreementButtons() {
        const [tab] = await chrome.tabs.query({
            active: true,
            currentWindow: true,
        });
        const [{ result }] = await chrome.scripting.executeScript({
            target: { tabId: tab.id },
            func: () => {
                // Look for common agreement buttons/checkboxes
                const agreeElements = document.querySelectorAll(
                    'button, input[type="submit"], input[type="checkbox"]'
                );
                return Array.from(agreeElements).some((el) => {
                    const text =
                        el.textContent?.toLowerCase() || el.value?.toLowerCase() || "";
                    return (
                        text.includes("agree") ||
                        text.includes("accept") ||
                        text.includes("consent")
                    );
                });
            },
        });
        return result;
    }

    document
        .getElementById("startButton")
        .addEventListener("click", async function () {
            const summaryDiv = document.getElementById("summary");
            const actionButtons = document.getElementById("actionButtons");
            summaryDiv.textContent = "Analyzing page...";
            actionButtons.classList.add("hidden");

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

                const prompt = `Please analyze these terms and conditions and provide:
                    1. A clear summary of what the user is agreeing to
                    2. Key points to consider
                    3. Any potential red flags
                    Format the response with proper spacing and clearly formatted for the user: ${result}`;

                // Call OpenAI API
                const openaiResponse = await fetch(
                    "https://api.openai.com/v1/chat/completions",
                    {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                            Authorization: `Bearer ${apiKey}`,
                        },
                        body: JSON.stringify({
                            model: "gpt-3.5-turbo",
                            messages: [
                                {
                                    role: "user",
                                    content: prompt,
                                },
                            ],
                        }),
                    }
                );

                const data = await openaiResponse.json();
                if (data.error) {
                    throw new Error(data.error.message);
                }
                summaryDiv.innerHTML = data.choices[0].message.content.replace(
                    /\n/g,
                    "<br>"
                );

                // Check if agreement options exist on the page
                const hasAgreementOptions = await checkForAgreementButtons();
                if (hasAgreementOptions) {
                    actionButtons.classList.remove("hidden");
                }
            } catch (error) {
                summaryDiv.textContent = `Error: ${error.message}`;
                summaryDiv.classList.add("error");
            }
        });

    // Add click handlers for agree/disagree buttons
    document
        .getElementById("agreeButton")
        .addEventListener("click", async function () {
            const [tab] = await chrome.tabs.query({
                active: true,
                currentWindow: true,
            });
            await chrome.scripting.executeScript({
                target: { tabId: tab.id },
                func: () => {
                    const agreeElements = document.querySelectorAll(
                        'button, input[type="submit"], input[type="checkbox"]'
                    );
                    for (const el of agreeElements) {
                        const text =
                            el.textContent?.toLowerCase() || el.value?.toLowerCase() || "";
                        if (
                            text.includes("agree") ||
                            text.includes("accept") ||
                            text.includes("consent")
                        ) {
                            if (el.type === "checkbox") el.checked = true;
                            el.click();
                            break;
                        }
                    }
                },
            });
        });
});
