// Global variables to store current analysis
let currentAnalysis = null;
let currentRewrite = null;

async function analyzeText() {
  const text = document.getElementById("userText").value;
  const context = document.getElementById("contextSelect").value;
  const resultsDiv = document.getElementById("results");
  const rewriteSection = document.getElementById("rewriteSection");
  const popup = document.getElementById("warningPopup");
  
  if (!text.trim()) {
    resultsDiv.innerHTML = "<p>Please enter some text to analyze.</p>";
    return;
  }
  
  // Hide previous rewrite section
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
    
    // Store current analysis
    currentAnalysis = { text, context, data };
    
    // Show warning popup if toxic
    if (data.is_toxic) {
      popup.classList.add("show");
      setTimeout(() => popup.classList.remove("show"), 5000);
    }
    
    // Display analysis results
    displayAnalysisResults(data, context);
    
    // Show rewrite button if content is toxic
    if (data.is_toxic) {
      showRewriteOption();
    }
    
  } catch (error) {
    resultsDiv.innerHTML = "<p>Error connecting to server. Please try again.</p>";
    console.error("Error:", error);
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
  
  // Add overall assessment
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
  
  // Show loading popup
  loadingPopup.classList.add("show");
  
  try {
    const response = await fetch("https://retone-ai-lite.onrender.com/rewrite", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ 
        text: currentAnalysis.text, 
        context: currentAnalysis.context 
      })
    });
    
    const data = await response.json();
    
    // Hide loading popup
    loadingPopup.classList.remove("show");
    
    if (data.error) {
      alert(`Rewrite failed: ${data.error}`);
      return;
    }
    
    // Store current rewrite
    currentRewrite = data.rewritten_text;
    
    // Show rewrite section
    displayRewrite(data.rewritten_text);
    
  } catch (error) {
    loadingPopup.classList.remove("show");
    alert("Error getting rewrite. Please try again.");
    console.error("Error:", error);
  }
}

function displayRewrite(rewrittenText) {
  const rewriteSection = document.getElementById("rewriteSection");
  const rewriteTextDiv = document.getElementById("rewriteText");
  
  rewriteTextDiv.textContent = rewrittenText;
  rewriteSection.style.display = "block";
  
  // Scroll to rewrite section
  rewriteSection.scrollIntoView({ behavior: 'smooth' });
}

function useRewrite() {
  if (!currentRewrite) return;
  
  const textarea = document.getElementById("userText");
  textarea.value = currentRewrite;
  
  // Hide rewrite section
  document.getElementById("rewriteSection").style.display = "none";
  
  // Show success message
  showSuccessMessage("Rewrite applied! You can now copy or send this message.");
}

function tryAgain() {
  // Request another rewrite
  requestRewrite();
}

async function giveFeedback(rating) {
  if (!currentAnalysis || !currentRewrite) return;
  
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
    
    // Show feedback confirmation
    showSuccessMessage(data.message || "Thank you for your feedback!");
    
    // Disable feedback buttons
    const feedbackButtons = document.querySelectorAll('.feedback-btn');
    feedbackButtons.forEach(btn => {
      btn.disabled = true;
      btn.style.opacity = '0.5';
    });
    
  } catch (error) {
    console.error("Error submitting feedback:", error);
    feedbackBtn.classList.remove("clicked");
  }
}

function showSuccessMessage(message) {
  // Create temporary success popup
  const successPopup = document.createElement('div');
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
  
  // Remove after 3 seconds
  setTimeout(() => {
    successPopup.style.animation = 'slideOutRight 0.3s ease';
    setTimeout(() => {
      document.body.removeChild(successPopup);
    }, 300);
  }, 3000);
}

function getBarColor(score) {
  if (score >= 70) return "#dc2626"; // Red
  if (score >= 40) return "#f97316"; // Orange
  if (score >= 20) return "#eab308"; // Yellow
  return "#22c55e"; // Green
}

function getContextDisplay(context) {
  const displays = {
    chat: "Chat Message",
    social: "Social Media Post",
    email: "Professional Email"
  };
  
  return displays[context] || "Chat Message";
}

// Add CSS animations for success popup
const style = document.createElement('style');
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

// Listen for Enter key to submit text
document.addEventListener("DOMContentLoaded", function () {
  const textarea = document.getElementById("userText");
  textarea.addEventListener("keydown", function (event) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      analyzeText();
    }
  });
  
  // Clear results when text changes
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