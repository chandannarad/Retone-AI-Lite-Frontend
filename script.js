document.addEventListener("DOMContentLoaded", function () {
    const resultDiv = document.getElementById("result");

    window.analyzeText = async function () {
        const textInput = document.getElementById("textInput");
        const inputText = textInput.value.trim();

        if (!inputText) {
            resultDiv.innerHTML = "Please enter some text.";
            return;
        }

        try {
            const response = await fetch("https://retone-ai-lite.onrender.com/analyze", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ text: inputText })
            });

            if (!response.ok) {
                throw new Error("Network response was not ok");
            }

            const data = await response.json();

            if (data && Object.keys(data).length > 0) {
                let output = "<h3>Tone Analysis Result:</h3><ul>";
                for (let key in data) {
                    output += `<li><strong>${key}:</strong> ${data[key]}%</li>`;
                }
                output += "</ul>";
                resultDiv.innerHTML = output;
            } else {
                resultDiv.innerHTML = "No scores returned.";
            }
        } catch (error) {
            console.error("Error analyzing text:", error);
            resultDiv.innerHTML = "Error analyzing text. Please try again later.";
        }
    };
});
