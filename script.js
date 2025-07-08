async function analyzeText() {
  const text = document.getElementById("userText").value;
  const context = document.getElementById("contextSelect").value;
  const resultsDiv = document.getElementById("results");
  const popup = document.getElementById("warningPopup");
  
  if (!text.trim()) {
    resultsDiv.innerHTML = "<p>Please enter some text to analyze.</p>";
    return;
  }
  
  resultsDiv.innerHTML = "<p>Analyzing...</p>";
  
  try {
    const response = await fetch("https://retone-ai-lite.onrender.com/analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text, context })
    });
    
    const data = await response.json();
    
    if (data.error) {
      resultsDiv.innerHTML = `<p>Error: ${data.error}</p>`;
      return;
    }
    
    // Context-aware thresholds
    const thresholds = getThresholds(context);
    
    if ((data["TOXICITY"] || 0) >= thresholds.toxicity || 
        (data["INSULT"] || 0) >= thresholds.insult || 
        (data["THREAT"] || 0) >= thresholds.threat || 
        (data["PROFANITY"] || 0) >= thresholds.profanity) {
      popup.classList.add("show");
      setTimeout(() => popup.classList.remove("show"), 5000);
    }
    
    resultsDiv.innerHTML = `<h3>Analysis Result (${getContextDisplay(context)}):</h3>`;
    const attributes = ["TOXICITY", "INSULT", "PROFANITY", "THREAT"];
    attributes.forEach(attr => {
      const score = data[attr] || 0;
      resultsDiv.innerHTML += `
        <div class="label">${attr}: ${score}%</div>
        <div class="bar" style="width:${score}%;"></div>
      `;
    });
    
  } catch (error) {
    resultsDiv.innerHTML = "<p>Error connecting to server. Please try again.</p>";
    console.error("Error:", error);
  }
}

function getThresholds(context) {
  const thresholds = {
    chat: {
      toxicity: 40,
      insult: 30,
      threat: 20,
      profanity: 30
    },
    social: {
      toxicity: 35,
      insult: 25,
      threat: 15,
      profanity: 25
    },
    email: {
      toxicity: 25,
      insult: 20,
      threat: 10,
      profanity: 20
    }
  };
  
  return thresholds[context] || thresholds.chat;
}

function getContextDisplay(context) {
  const displays = {
    chat: "Chat Message",
    social: "Social Media Post",
    email: "Professional Email"
  };
  
  return displays[context] || "Chat Message";
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
});