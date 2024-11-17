document.addEventListener("DOMContentLoaded", async function () {
  console.log("Popup loaded");

  // Show start button by default
  const startButton = document.getElementById("startButton");
  const reAnalyzeButton = document.getElementById("reAnalyzeButton");
  const policyDiv = document.getElementById("storedPolicyLinks");
  const policyLinksList = document.getElementById("policyLinksList");
  const summaryDiv = document.getElementById("summary");
  const actionButtons = document.getElementById("actionButtons");
  const urlElement = document.getElementById("url");

  startButton.classList.remove("hidden");

  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  const currentUrl = tab.url;
  urlElement.textContent = `Current URL: ${currentUrl}`;

  // Check and load policy links
  await loadAndDisplayPolicyLinks(currentUrl);

  // Check if a summary exists
  chrome.storage.local.get(`summary_${currentUrl}`, function (data) {
    const summary = data[`summary_${currentUrl}`];
    if (summary) {
      startButton.classList.add("hidden");
      reAnalyzeButton.classList.remove("hidden");
      loadSummaryFromStorage(currentUrl);
    } else {
      startButton.classList.remove("hidden");
      reAnalyzeButton.classList.add("hidden");
    }
  });

  startButton.addEventListener("click", startAnalysis);
  reAnalyzeButton.addEventListener("click", reAnalyzePage);
  document
    .getElementById("agreeButton")
    .addEventListener("click", agreeToPolicy);

  async function loadAndDisplayPolicyLinks(url) {
    console.log("Loading and displaying policy links...");
    // Check if policy links are in storage
    chrome.storage.local.get(`policyLinks_${url}`, async function (data) {
      let links = data[`policyLinks_${url}`];
      if (!links || links.length === 0) {
        // If not found in storage, find policy links on the page
        links = await findPolicyLinks();
        chrome.storage.local.set({ [`policyLinks_${url}`]: links });
      }
      // Update UI
      if (links.length > 0) {
        policyDiv.innerHTML = `<br><strong>Policy Links:</strong><br><ul>${links
          .map(
            (link) => `<li><a href="${link}" target="_blank">${link}</a></li>`
          )
          .join("")}</ul>`;
        console.log("Policy links displayed");
      } else {
        policyDiv.innerHTML = "<br>No policy links found on this page.";
        console.log("No policy links found.");
      }
    });
  }

  async function findPolicyLinks() {
    console.log("Searching for Terms & Conditions or Privacy Policy links...");
    const [{ result }] = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: () => {
        const links = Array.from(document.querySelectorAll("a"));
        return links
          .filter((link) => {
            const href = link.href.toLowerCase();
            const text = link.textContent.toLowerCase();
            return (
              text.includes("terms") ||
              text.includes("privacy") ||
              text.includes("policy") ||
              href.includes("terms") ||
              href.includes("privacy") ||
              href.includes("policy")
            );
          })
          .map((link) => link.href); // Collect the href of the matching links
      },
    });
    return result;
  }

  async function startAnalysis() {
    console.log("Start button clicked");
    summaryDiv.textContent = "Analyzing page...";
    actionButtons.classList.add("hidden");

    const summaryKey = `summary_${currentUrl}`;

    try {
      const storedSummary = await chrome.storage.local.get(summaryKey);
      if (storedSummary[summaryKey]) {
        summaryDiv.innerHTML = storedSummary[summaryKey].replace(/\n/g, "<br>");
        actionButtons.classList.remove("hidden");
        reAnalyzeButton.classList.remove("hidden");
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

      const prompt = `Please analyze these terms and conditions / privacy policies and provide ONLY AND ONLY a score out of 5 for EACH of the following points:
        - Data Collection (/5)
        - Data Usage (/5)
        - Data Sharing (/5)
        - Data Selling (/5)
        - Opt-out Options (/5)
        - Data Security (/5)
        - Data Deletion (/5)
        - Policy Clarity (/5)

      Afterwards, display each score again but for each rating, provide a single, brief sentence for each score explaining why you gave it that specific score, under the score.  

      Analyze the following policy:
      ${result}`;

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
      actionButtons.classList.remove("hidden");
    } catch (error) {
      console.error("Error occurred:", error);
      summaryDiv.textContent = `Error: ${error.message}`;
    }
  }

  async function reAnalyzePage() {
    console.log("Re-analyze button clicked");
    await chrome.storage.local.remove(`summary_${currentUrl}`);
    reAnalyzeButton.classList.add("hidden");
    startButton.classList.remove("hidden");
    summaryDiv.textContent = "";
    actionButtons.classList.add("hidden");
    startAnalysis();
  }

  async function agreeToPolicy() {
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
  }

  function loadSummaryFromStorage(url) {
    console.log("Loading summary from storage...");
    chrome.storage.local.get(`summary_${url}`, function (data) {
      const summary = data[`summary_${url}`];
      if (summary) {
        summaryDiv.innerHTML = summary.replace(/\n/g, "<br>");
        actionButtons.classList.remove("hidden");
        reAnalyzeButton.classList.remove("hidden");
        console.log("Summary loaded and displayed");
      } else {
        console.log("No summary found in storage for this URL");
      }
    });
  }
});
