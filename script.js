document.addEventListener("DOMContentLoaded", function () {
  const resultDiv = document.getElementById("result");
  const popup = document.getElementById("popup");

  // Hide popup initially
  popup.classList.remove("show");

  window.analyzeText = async function () {
    const inputText = document.getElementById("textInput").value.trim();
    resultDiv.innerHTML = "";
    popup.classList.remove("show");

    if (!inputText) {
      resultDiv.innerHTML = "Please enter some text.";
      return;
    }

    try {
      const response = await fetch("https://retone-ai-lite.onrender.com/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ text: inputText }),
      });

      const data = await response.json();

      if (data && Object.keys(data).length > 0) {
        let output = "<h3>Tone Analysis Result:</h3><ul>";
        for (let key in data) {
          output += `<li><strong>${key}:</strong> ${data[key]}%</li>`;
        }
        output += "</ul>";
        resultDiv.innerHTML = output;

        // Show popup if toxicity or insult exceeds threshold
        if ((data.TOXICITY || 0) > 70 || (data.INSULT || 0) > 70) {
          popup.classList.add("show");
          setTimeout(() => popup.classList.remove("show"), 4000);
        }
      } else {
        resultDiv.innerHTML = "No tone scores found.";
      }
    } catch (error) {
      console.error("Error:", error);
      resultDiv.innerHTML = "An error occurred. Please try again.";
    }
  };
});
