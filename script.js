document.addEventListener("DOMContentLoaded", () => {
  const textarea = document.getElementById("textInput");
  const popup = document.getElementById("popup");
  const resultDiv = document.getElementById("result");

  // Submit on Enter key
  textarea.addEventListener("keydown", function (event) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      analyzeText();
    }
  });

  window.analyzeText = async function () {
    const text = textarea.value.trim();
    resultDiv.innerHTML = "";
    popup.classList.add("hidden");

    if (!text) {
      resultDiv.innerHTML = "<p>Please enter some text.</p>";
      return;
    }

    try {
      const response = await fetch("https://retone-ai-lite.onrender.com/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ text })
      });

      const data = await response.json();

      if (!data || !data.scores) {
        resultDiv.innerHTML = "<p>Something went wrong. Try again later.</p>";
        return;
      }

      // Display scores
      const resultList = document.createElement("ul");
      for (const [key, value] of Object.entries(data.scores)) {
        const item = document.createElement("li");
        item.textContent = `${key}: ${value}%`;
        resultList.appendChild(item);
      }
      resultDiv.appendChild(resultList);

      // Trigger popup if any score is above threshold (e.g., 75%)
      const toxicThreshold = 75;
      const isToxic = Object.values(data.scores).some(score => score >= toxicThreshold);
      if (isToxic) {
        popup.classList.remove("hidden");
        popup.classList.add("show");
        setTimeout(() => popup.classList.remove("show"), 4000);
      }

    } catch (err) {
      resultDiv.innerHTML = "<p>Failed to analyze the text.</p>";
      console.error(err);
    }
  };
});
