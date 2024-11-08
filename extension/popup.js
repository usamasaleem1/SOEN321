
document.addEventListener("DOMContentLoaded", function () {
    console.log("Popup loaded");
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
        console.log("Current tab URL:", tabs[0].url);
        document.getElementById("url").textContent = `Current URL: ${tabs[0].url}`;
    });

    async function checkForAgreementButtons() {
        console.log("Checking for agreement buttons...");
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
        console.log("Agreement buttons found:", result);
        return result;
    }

    document
        .getElementById("startButton")
        .addEventListener("click", async function () {
            console.log("Start button clicked");
            const summaryDiv = document.getElementById("summary");
            const actionButtons = document.getElementById("actionButtons");
            summaryDiv.textContent = "Analyzing page...";
            actionButtons.classList.add("hidden");

            try {
                // Get API key from storage
                const { apiKey } = await chrome.storage.sync.get("apiKey");
                console.log("API key retrieved from storage:", apiKey ? "Present" : "Missing");
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
                console.log("Analyzing tab:", tab.url);

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
                console.log("Page content retrieved, length:", result.length);

                const prompt = `Please analyze these terms and conditions and provide:
                    1. A clear summary of what the user is agreeing to
                    2. Key points to consider
                    3. Any potential red flags
                    Format the response with proper spacing and clearly formatted for the user: ${result}`;

                console.log("Sending request to OpenAI API...");
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
                console.log("OpenAI API response received:", data);
                if (data.error) {
                    throw new Error(data.error.message);
                }
                summaryDiv.innerHTML = data.choices[0].message.content.replace(
                    /\n/g,
                    "<br>"
                );
                saveSummaryToStorage(data.choices[0].message.content);

                // Add this function to save the summary to storage
                function saveSummaryToStorage(summary) {
                    console.log("Saving summary to storage:", summary.substring(0, 100) + "...");
                    chrome.storage.local.set({ summary }, () => {
                        console.log("Summary saved successfully");
                    });
                }

                // Add this function to load the summary from storage when the popup is opened
                function loadSummaryFromStorage() {
                    console.log("Loading summary from storage...");
                    chrome.storage.local.get("summary", function (data) {
                        if (data.summary) {
                            console.log("Summary found in storage:", data.summary.substring(0, 100) + "...");
                            summaryDiv.innerHTML = data.summary.replace(/\n/g, "<br>");
                            actionButtons.classList.remove("hidden");
                            console.log("Summary loaded and displayed");
                        } else {
                            console.log("No summary found in storage");
                        }
                    });
                }

                // Call loadSummaryFromStorage when the popup is loaded
                loadSummaryFromStorage();

                // Check if agreement options exist on the page
                const hasAgreementOptions = await checkForAgreementButtons();
                console.log("Agreement options check result:", hasAgreementOptions);
                if (hasAgreementOptions) {
                    actionButtons.classList.remove("hidden");
                    console.log("Action buttons displayed");
                }
            } catch (error) {
                console.error("Error occurred:", error);
                summaryDiv.textContent = `Error: ${error.message}`;
                summaryDiv.classList.add("error");
            }
        });

    // Add click handlers for agree/disagree buttons
    document
        .getElementById("agreeButton")
        .addEventListener("click", async function () {
            console.log("Agree button clicked");
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
                            console.log("Agreement element clicked:", text);
                            break;
                        }
                    }
                },
            });
            console.log("Agreement action completed");
        });

    document.getElementById("reAnalyzeButton").addEventListener("click", function () {
        console.log("Re-analyze button clicked");
        // Clear the stored summary and re-analyze the page
        chrome.storage.local.remove("summary", function () {
            console.log("Summary cleared from storage");
            document.getElementById("startButton").click();
        });
    });
});
