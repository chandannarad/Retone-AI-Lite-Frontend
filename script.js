let currentAnalysis = null;

async function analyzeText() {
  const text = document.getElementById("userText").value;
  const context = document.getElementById("contextSelect").value;
  const resultsDiv = document.getElementById("results");
  const popup = document.getElementById("warningPopup");
  const rewriteSection = document.getElementById("rewriteSection");
  
  if (!text.trim()) {
    resultsDiv.innerHTML = "<p>Please enter some text to analyze.</p>";
    rewriteSection.style.display = "none";
    return;
  }
  
  resultsDiv.innerHTML = "<p>Analyzing...</p>";
  rewriteSection.style.display = "none";
  
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
    
    // Store current analysis for rewriting
    currentAnalysis = { text, context, scores: data };
    
    // Context-aware thresholds
    const thresholds = getThresholds(context);
    const isToxic = (data["TOXICITY"] || 0) >= thresholds.toxicity || 
                   (data["INSULT"] || 0) >= thresholds.insult || 
                   (data["THREAT"] || 0) >= thresholds.threat || 
                   (data["PROFANITY"] || 0) >= thresholds.profanity;
    
    if (isToxic) {
      popup.classList.add("show");
      setTimeout(() => popup.classList.remove("show"), 5000);
      rewriteSection.style.display = "block";
    } else {
      rewriteSection.style.display = "none";
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

async function rewriteText() {
  if (!currentAnalysis) return;
  
  const rewriteBtn = document.querySelector(".rewrite-btn");
  const rewriteResults = document.getElementById("rewriteResults");
  
  // Show loading state
  rewriteBtn.disabled = true;
  rewriteBtn.innerHTML = '<span class="loading-spinner"></span> Rewriting...';
  rewriteResults.innerHTML = "";
  
  try {
    const response = await fetch("https://retone-ai-lite.onrender.com/rewrite", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        text: currentAnalysis.text,
        context: currentAnalysis.context,
        scores: currentAnalysis.scores
      })
    });
    
    const data = await response.json();
    
    if (data.error) {
      rewriteResults.innerHTML = `<p>Error: ${data.error}</p>`;
      return;
    }
    
    // Display rewrite suggestions
    rewriteResults.innerHTML = "<h3>💡 Suggested Alternatives:</h3>";
    data.suggestions.forEach((suggestion, index) => {
      rewriteResults.innerHTML += `
        <div class="rewrite-suggestion">
          <h4>${suggestion.type}</h4>
          <div class="rewrite-text">${suggestion.text}</div>
          <div class="rewrite-actions">
            <button class="use-btn" onclick="useRewrite('${escapeHtml(suggestion.text)}')">
              Use This
            </button>
            <button class="feedback-btn" onclick="giveFeedback(${index}, 'up')">
              👍
            </button>
            <button class="feedback-btn" onclick="giveFeedback(${index}, 'down')">
              👎
            </button>
          </div>
        </div>
      `;
    });
    
  } catch (error) {
    rewriteResults.innerHTML = "<p>Error generating rewrites. Please try again.</p>";
    console.error("Error:", error);
  } finally {
    // Reset button state
    rewriteBtn.disabled = false;
    rewriteBtn.innerHTML = "⚡ Rewrite This Message";
  }
}

function useRewrite(text) {
  const textarea = document.getElementById("userText");
  textarea.value = text;
  textarea.focus();
  
  // Hide rewrite section and clear results
  document.getElementById("rewriteSection").style.display = "none";
  document.getElementById("results").innerHTML = "";
  currentAnalysis = null;
  
  // Show success message briefly
  const popup = document.getElementById("warningPopup");
  popup.innerHTML = "✅ <strong>Success:</strong> Message updated with suggestion!";
  popup.classList.add("show");
  setTimeout(() => {
    popup.classList.remove("show");
    // Reset popup message
    setTimeout(() => {
      popup.innerHTML = "⚠️ <strong>Warning:</strong> Your message may contain harmful or offensive language.";
    }, 500);
  }, 3000);
}

function giveFeedback(index, type) {
  const feedbackBtns = document.querySelectorAll(`.rewrite-suggestion:nth-child(${index + 2}) .feedback-btn`);
  
  // Remove active class from all buttons in this suggestion
  feedbackBtns.forEach(btn => btn.classList.remove("active"));
  
  // Add active class to clicked button
  if (type === 'up') {
    feedbackBtns[0].classList.add("active");
  } else {
    feedbackBtns[1].classList.add("active");
  }
  
  // Here you could send feedback to your backend for future improvements
  console.log(`Feedback for suggestion ${index}: ${type}`);
}

function escapeHtml(text) {
  return text.replace(/'/g, "&#39;").replace(/"/g, "&quot;");
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