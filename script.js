// 🔹 Offensive Word Filter (NEW)
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

// Global variables to store current analysis
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
    console.log("Analyze API response:", data);
    
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
  if (!currentAnalysis) {
    console.error("No current analysis available");
    return;
  }
  
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
        text: softRewrite(currentAnalysis.text),  // 🔸 Only line changed
        context: currentAnalysis.context 
      })
    });
    
    const data = await response.json();
    console.log("Rewrite API response:", data);
    
    loadingPopup.classList.remove("show");
    
    if (data.error) {
      console.error("Rewrite error:", data.error);
      alert(`Rewrite failed: ${data.error}`);
      rewriteSection.style.display = "none";
      return;
    }
    
    if (data.rewritten_text && data.rewritten_text.trim().toLowerCase() !== currentAnalysis.text.trim().toLowerCase()) {
      currentRewrite = data.rewritten_text;
      console.log("Storing rewrite:", currentRewrite);
      displayRewrite(data.rewritten_text);
    } else {
      console.warn("Rewrite is identical to input or invalid:", data.rewritten_text);
      rewriteTextDiv.textContent = "Unable to generate a different rewrite. Please try again.";
      rewriteSection.style.display = "block";
      rewriteSection.scrollIntoView({ behavior: "smooth" });
    }
    
  } catch (error) {
    loadingPopup.classList.remove("show");
    console.error("Rewrite request failed:", error);
    alert("Error getting rewrite. Please try again.");
    rewriteSection.style.display = "none";
  }
}

function displayRewrite(rewrittenText) {
  const rewriteSection = document.getElementById("rewriteSection");
  const rewriteTextDiv = document.getElementById("rewriteText");
  
  console.log("Before update - rewriteTextDiv content:", rewriteTextDiv.textContent);
  rewriteTextDiv.textContent = rewrittenText;
  console.log("After update - rewriteTextDiv content:", rewriteTextDiv.textContent);
  
  rewriteSection.style.display = "block";
  rewriteSection.scrollIntoView({ behavior: "smooth" });
}

function useRewrite() {
  if (!currentRewrite) {
    console.error("No current rewrite available");
    return;
  }
  
  const textarea = document.getElementById("userText");
  console.log("Applying rewrite to textarea:", currentRewrite);
  textarea.value = currentRewrite;
  
  document.getElementById("rewriteSection").style.display = "none";
  
  showSuccessMessage("Rewrite applied! You can now copy or send this message.");
}

function tryAgain() {
  console.log("Trying another rewrite");
  requestRewrite();
}

async function giveFeedback(rating) {
  if (!currentAnalysis || !currentRewrite) {
    console.error("Cannot submit feedback: missing analysis or rewrite");
    return;
  }
  
  const feedbackBtn = event.target;
  feedbackBtn.classList.add("clicked");
  
  try {
    const response = await fetch("https://retone-ai-lite.onrender.com/feedback", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        original_text: currentAnalysis.text,
        rewritten_text: currentRewrite,
        rating: rating,
        context: currentAnalysis.context
      })
    });
    
    const data = await response.json();
    console.log("Feedback response:", data);
    
    showSuccessMessage(data.message || "Thank you for your feedback!");
    
    const feedbackButtons = document.querySelectorAll(".feedback-btn");
    feedbackButtons.forEach(btn => {
      btn.disabled = true;
      btn.style.opacity = "0.5";
    });
    
  } catch (error) {
    console.error("Error submitting feedback:", error);
    feedbackBtn.classList.remove("clicked");
  }
}

function showSuccessMessage(message) {
  const successPopup = document.createElement("div");
  successPopup.style.cssText = `
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
  successPopup.textContent = message;
  
  document.body.appendChild(successPopup);
  
  setTimeout(() => {
    successPopup.style.animation = "slideOutRight 0.3s ease";
    setTimeout(() => {
      document.body.removeChild(successPopup);
    }, 300);
  }, 3000);
}

function getBarColor(score) {
  if (score >= 70) return "#dc2626";
  if (score >= 40) return "#f97316";
  if (score >= 20) return "#eab308";
  return "#22c55e";
}

function getContextDisplay(context) {
  const displays = {
    chat: "Chat Message",
    social: "Social Media Post",
    email: "Professional Email"
  };
  return displays[context] || "Chat Message";
}

const style = document.createElement("style");
style.textContent = `
  @keyframes slideInRight {
    from {
      transform: translateX(100%);
      opacity: 0;
    }
    to {
      transform: translateX(0);
      opacity: 1;
    }
  }
  
  @keyframes slideOutRight {
    from {
      transform: translateX(0);
      opacity: 1;
    }
    to {
      transform: translateX(100%);
      opacity: 0;
    }
  }
`;
document.head.appendChild(style);

document.addEventListener("DOMContentLoaded", function () {
  const textarea = document.getElementById("userText");
  textarea.addEventListener("keydown", function (event) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      analyzeText();
    }
  });
  
  textarea.addEventListener("input", function() {
    const resultsDiv = document.getElementById("results");
    const rewriteSection = document.getElementById("rewriteSection");
    
    if (resultsDiv.innerHTML.includes("Analysis Result")) {
      resultsDiv.innerHTML = "";
      rewriteSection.style.display = "none";
      currentAnalysis = null;
      currentRewrite = null;
    }
  });
});