document.addEventListener("DOMContentLoaded", function() {
    // Load saved API key
    chrome.storage.sync.get("apiKey", function(data) {
        document.getElementById("apiKey").value = data.apiKey || "";
    });

    // Save API key
    document.getElementById("save").addEventListener("click", function() {
        const apiKey = document.getElementById("apiKey").value;
        chrome.storage.sync.set({
                apiKey: apiKey,
            },
            function() {
                const status = document.getElementById("status");
                status.textContent = "API key saved.";
                setTimeout(function() {
                    status.textContent = "";
                }, 2000);
            }
        );
    });
});