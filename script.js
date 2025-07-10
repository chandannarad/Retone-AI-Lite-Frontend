const offensiveMap = {
  "fuck": "screw",
  "shit": "mess",
  "bitch": "person",
  "damn": "darn",
  "asshole": "jerk",
  "bastard": "idiot",
  "crap": "nonsense",
  "dick": "jerk",
  "piss": "irritate",
  "slut": "woman",
  "whore": "person",
  "retard": "person",
  "stupid": "unreasonable"
};

function softRewrite(text) {
  let cleaned = text;
  Object.keys(offensiveMap).forEach((word) => {
    const regex = new RegExp(`\\b${word}\\b`, "gi");
    cleaned = cleaned.replace(regex, offensiveMap[word]);
  });
  return cleaned;
}

let currentAnalysis = null;
let currentRewrite = null;

async function analyzeText() {
  const text = document.getElementById("userText").value.trim();
  const context = document.getElementById("contextSelect").value;
  const resultsDiv = document.getElementById("results");
  const rewriteSection = document.getElementById("rewriteSection");
  const popup = document.getElementById("warningPopup");

  if (!text) {
    resultsDiv.innerHTML = "<p>Please enter some text to analyze.</p>";
    return;
  }

  rewriteSection.style.display = "none";
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

    currentAnalysis = { text, context, data };
    currentRewrite = null;

    if (data.is_toxic) {
      popup.classList.add("show");
      setTimeout(() => popup.classList.remove("show"), 5000);
    }

    displayAnalysisResults(data, context);

    if (data.is_toxic) {
      showRewriteOption();
    }

  } catch (error) {
    resultsDiv.innerHTML = "<p>Error connecting to server. Please try again.</p>";
    console.error("Analyze error:", error);
  }
}

function displayAnalysisResults(data, context) {
  const resultsDiv = document.getElementById("results");
  resultsDiv.innerHTML = `<h3>Analysis Result (${getContextDisplay(context)}):</h3>`;

  const attributes = ["TOXICITY", "INSULT", "PROFANITY", "THREAT"];
  attributes.forEach(attr => {
    const score = data[attr] || 0;
    const barColor = getBarColor(score);
    resultsDiv.innerHTML += `
      <div class="label">
        <span>${attr}</span>
        <span>${score}%</span>
      </div>
      <div class="bar" style="width:${score}%; background-color:${barColor};"></div>
    `;
  });

  const overallStatus = data.is_toxic ? "⚠️ Potentially Harmful" : "✅ Respectful";
  const statusColor = data.is_toxic ? "#ef4444" : "#22c55e";

  resultsDiv.innerHTML += `
    <div style="margin-top: 15px; padding: 10px; background-color: ${statusColor}20; border-radius: 8px; border-left: 4px solid ${statusColor};">
      <strong style="color: ${statusColor};">${overallStatus}</strong>
    </div>
  `;
}

function showRewriteOption() {
  const resultsDiv = document.getElementById("results");
  resultsDiv.innerHTML += `
    <div style="margin-top: 15px; text-align: center;">
      <button onclick="requestRewrite()" style="background-color: #22c55e; width: auto; padding: 10px 20px;">
        ✨ Get Respectful Rewrite
      </button>
    </div>
  `;
}

async function requestRewrite() {
  if (!currentAnalysis) return;

  const loadingPopup = document.getElementById("loadingPopup");
  const rewriteSection = document.getElementById("rewriteSection");
  const rewriteTextDiv = document.getElementById("rewriteText");

  loadingPopup.classList.add("show");
  rewriteTextDiv.textContent = "";

  try {
    const response = await fetch("https://retone-ai-lite.onrender.com/rewrite", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        text: softRewrite(currentAnalysis.text),
        context: currentAnalysis.context
      })
    });

    const data = await response.json();
    loadingPopup.classList.remove("show");

    if (data.error) {
      alert(`Rewrite failed: ${data.error}`);
      rewriteSection.style.display = "none";
      return;
    }

    if (data.rewritten_text && data.rewritten_text.trim().toLowerCase() !== currentAnalysis.text.trim().toLowerCase()) {
      currentRewrite = data.rewritten_text;
      displayRewrite(data.rewritten_text);
    } else {
      rewriteTextDiv.textContent = "Unable to generate a different rewrite. Please try again.";
      rewriteSection.style.display = "block";
    }

  } catch (error) {
    loadingPopup.classList.remove("show");
    alert("Error getting rewrite. Please try again.");
    rewriteSection.style.display = "none";
  }
}

function displayRewrite(text) {
  document.getElementById("rewriteText").textContent = text;
  document.getElementById("rewriteSection").style.display = "block";
}

function useRewrite() {
  if (!currentRewrite) return;
  document.getElementById("userText").value = currentRewrite;
  document.getElementById("rewriteSection").style.display = "none";
  showSuccessMessage("Rewrite applied! You can now copy or send this message.");
}

function tryAgain() {
  requestRewrite();
}

async function giveFeedback(rating) {
  if (!currentAnalysis || !currentRewrite) return;

  const btn = event.target;
  btn.classList.add("clicked");

  try {
    const response = await fetch("https://retone-ai-lite.onrender.com/feedback", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        original_text: currentAnalysis.text,
        rewritten_text: currentRewrite,
        rating,
        context: currentAnalysis.context
      })
    });

    const data = await response.json();
    showSuccessMessage(data.message || "Thanks for your feedback!");

    const feedbackButtons = document.querySelectorAll(".feedback-btn");
    feedbackButtons.forEach(b => {
      b.disabled = true;
      b.style.opacity = "0.5";
    });

  } catch (error) {
    console.error("Feedback submission error:", error);
    btn.classList.remove("clicked");
  }
}

function showSuccessMessage(message) {
  const popup = document.createElement("div");
  popup.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background-color: #22c55e;
    color: white;
    padding: 15px 20px;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.3);
    z-index: 10000;
    animation: slideInRight 0.3s ease;
  `;
  popup.textContent = message;
  document.body.appendChild(popup);

  setTimeout(() => {
    popup.style.animation = "slideOutRight 0.3s ease";
    setTimeout(() => document.body.removeChild(popup), 300);
  }, 3000);
}

function getBarColor(score) {
  if (score >= 70) return "#dc2626";
  if (score >= 40) return "#f97316";
  if (score >= 20) return "#eab308";
  return "#22c55e";
}

function getContextDisplay(context) {
  return {
    chat: "Chat Message",
    social: "Social Media Post",
    email: "Professional Email"
  }[context] || "Chat Message";
}

document.addEventListener("DOMContentLoaded", function () {
  const textarea = document.getElementById("userText");
  textarea.addEventListener("keydown", function (event) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      analyzeText();
    }
  });

  textarea.addEventListener("input", function () {
    document.getElementById("results").innerHTML = "";
    document.getElementById("rewriteSection").style.display = "none";
    currentAnalysis = null;
    currentRewrite = null;
  });

  // Inject animations
  const style = document.createElement("style");
  style.textContent = `
    @keyframes slideInRight {
      from { transform: translateX(100%); opacity: 0; }
      to { transform: translateX(0); opacity: 1; }
    }
    @keyframes slideOutRight {
      from { transform: translateX(0); opacity: 1; }
      to { transform: translateX(100%); opacity: 0; }
    }
  `;
  document.head.appendChild(style);
});