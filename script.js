document.addEventListener("DOMContentLoaded", function () {
  const analyzeBtn = document.getElementById("analyzeBtn");
  const inputText = document.getElementById("userInput");
  const resultBox = document.getElementById("resultBox");
  const popup = document.getElementById("popup");

  analyzeBtn.addEventListener("click", analyzeText);
  inputText.addEventListener("keydown", function (e) {
    if (e.key === "Enter") {
      e.preventDefault(); // Prevents new line
      analyzeText();
    }
  });

  function analyzeText() {
    const text = inputText.value.trim();
    if (!text) return;

    fetch("https://retone-ai-lite.onrender.com/analyze", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ text: text })
    })
      .then(response => response.json())
      .then(data => {
        resultBox.innerHTML = ""; // Clear old results
        let toxicThreshold = 0.75;

        for (let attr in data) {
          let percentage = data[attr].toFixed(2) + "%";

          let bar = document.createElement("div");
          bar.className = "bar";
          bar.style.width = percentage;
          bar.style.backgroundColor = "red";
          bar.textContent = `${attr}: ${percentage}`;
          resultBox.appendChild(bar);
        }

        if (data.TOXICITY && data.TOXICITY >= toxicThreshold * 100) {
          popup.style.display = "block";
          popup.textContent = "⚠️ The message appears too toxic to send!";
        } else {
          popup.style.display = "none";
        }
      })
      .catch(error => {
        console.error("Error analyzing text:", error);
        popup.style.display = "block";
        popup.textContent = "❌ Error connecting to the server.";
      });
  }
});