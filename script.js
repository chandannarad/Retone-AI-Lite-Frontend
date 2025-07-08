async function analyzeText() {
  const text = document.getElementById("userText").value;
  const resultsDiv = document.getElementById("results");
  const popup = document.getElementById("warningPopup");
  resultsDiv.innerHTML = "<p>Analyzing...</p>";

  const response = await fetch("https://retone-ai-lite.onrender.com/analyze", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text })
  });

  const data = await response.json();

  if ((data["TOXICITY"] || 0) >= 40 || 
      (data["INSULT"] || 0) >= 30 || 
      (data["THREAT"] || 0) >= 20 || 
      (data["PROFANITY"] || 0) >= 30) {
    popup.classList.add("show");
    setTimeout(() => popup.classList.remove("show"), 5000);
  }

  resultsDiv.innerHTML = "<h3>Analysis Result:</h3>";
  const attributes = ["TOXICITY", "INSULT", "PROFANITY", "THREAT"];

  attributes.forEach(attr => {
    const score = data[attr] || 0;
    resultsDiv.innerHTML += `
      <div class="label">${attr}: ${score}%</div>
      <div class="bar" style="width:${score}%;"></div>
    `;
  });
}

// Listen for Enter key to submit text
document.addEventListener("DOMContentLoaded", function () {
  const textarea = document.getElementById("userText");
  textarea.addEventListener("keydown", function (event) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      analyzeText();
    }
  });
<<<<<<< HEAD
});
=======
});
>>>>>>> 81f60ea2fb4b04a71f9b895bbf44bfbb6b43a979
