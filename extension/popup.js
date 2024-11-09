document.addEventListener("DOMContentLoaded", function () {
  console.log("Popup loaded");

  chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
    const currentUrl = tabs[0].url;
    document.getElementById("url").textContent = `Current URL: ${currentUrl}`;
    loadSummaryFromStorage(currentUrl);
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
      console.log("Start button clicked");
      const summaryDiv = document.getElementById("summary");
      const actionButtons = document.getElementById("actionButtons");
      summaryDiv.textContent = "Analyzing page...";
      actionButtons.classList.add("hidden");

      const [tab] = await chrome.tabs.query({
        active: true,
        currentWindow: true,
      });
      const currentUrl = tab.url;
      const summaryKey = `summary_${currentUrl}`;

      try {
        const storedSummary = await chrome.storage.local.get(summaryKey);
        if (storedSummary[summaryKey]) {
          console.log(
            "Summary found in storage:",
            storedSummary[summaryKey].substring(0, 100) + "..."
          );
          summaryDiv.innerHTML = storedSummary[summaryKey].replace(
            /\n/g,
            "<br>"
          );
          actionButtons.classList.remove("hidden");
          return;
        }

        const { apiKey } = await chrome.storage.sync.get("apiKey");
        if (!apiKey)
          throw new Error(
            "Please set your OpenAI API key in the extension options"
          );

        const [{ result }] = await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          func: () => document.body.innerText.slice(0, 4000),
        });

        const prompt = `Please analyze these terms and conditions / privacy policies and provide ONLY AND ONLY a score (out of 5)
              of how reasonable or privacy-friendly for EACH point:
                  - Data Collection (/5)
                  - Data Usage (/5)
                  - Data Sharing (/5)
                  - Data Selling (/5)
                  - Opt-out Options (/5)
                  - Data Security (/5)
                  - Data Deletion (/5)
                  - Policy Clarity (/5)
                  Provide no description whatsoever and a rating out of 5 for each: ${result}`;

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
              messages: [{ role: "user", content: prompt }],
            }),
          }
        );

        const data = await openaiResponse.json();
        if (data.error) throw new Error(data.error.message);

        const summary = data.choices[0].message.content;
        summaryDiv.innerHTML = summary.replace(/\n/g, "<br>");
        chrome.storage.local.set({ [summaryKey]: summary });

        const hasAgreementOptions = await checkForAgreementButtons();
        if (hasAgreementOptions) {
          actionButtons.classList.remove("hidden");
        }
      } catch (error) {
        console.error("Error occurred:", error);
        summaryDiv.textContent = `Error: ${error.message}`;
        summaryDiv.classList.add("error");
      }
    });

  function loadSummaryFromStorage(url) {
    console.log("Loading summary from storage...");
    chrome.storage.local.get(`summary_${url}`, function (data) {
      const summary = data[`summary_${url}`];
      if (summary) {
        document.getElementById("summary").innerHTML = summary.replace(
          /\n/g,
          "<br>"
        );
        document.getElementById("actionButtons").classList.remove("hidden");
        console.log("Summary loaded and displayed");
      } else {
        console.log("No summary found in storage for this URL");
      }
    });
  }

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

  document
    .getElementById("reAnalyzeButton")
    .addEventListener("click", function () {
      chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
        const summaryKey = `summary_${tabs[0].url}`;
        chrome.storage.local.remove(summaryKey, function () {
          document.getElementById("startButton").click();
        });
      });
    });
});
