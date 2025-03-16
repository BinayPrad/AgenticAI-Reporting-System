const axios = require("axios");
require("dotenv").config();

async function parseGoal(goal) {
    try {
        const response = await axios.post(
            "https://api.openai.com/v1/chat/completions",
            {
                model: "gpt-4",
                messages: [
                    {
                        role: "system",
                        content: "You are an AI that breaks down a user's goal into structured subtasks. " +
                            "Ensure that if a goal mentions a quarter (Q1, Q2, etc.) and a year (e.g., 2024), " +
                            "the fetch data subtask includes them. Return a JSON object with a 'subtasks' array, " +
                            "where each subtask is an object with 'name' and optionally 'description' or 'details'."
                    },
                    { role: "user", content: `Break down this goal into subtasks: ${goal}` }
                ],
                temperature: 0.2
            },
            {
                headers: {
                    "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
                    "Content-Type": "application/json"
                }
            }
        );

        const rawContent = response.data.choices[0].message.content.trim();
        console.log("🔍 Raw OpenAI Response:", rawContent);

        let parsedResponse;
        try {
            parsedResponse = JSON.parse(rawContent);
        } catch (parseError) {
            console.error("🚨 Failed to parse OpenAI response into JSON.");
            return { error: "OpenAI response is not structured correctly." };
        }

        if (!parsedResponse.subtasks || !Array.isArray(parsedResponse.subtasks)) {
            console.error("🚨 OpenAI response does not contain a valid `subtasks` array.");
            return { error: "OpenAI response is not structured correctly." };
        }

        console.log("✅ Subtasks Parsed:", parsedResponse.subtasks);

        const enhancedSubtasks = parsedResponse.subtasks.map((subtask, index) => {
            const taskName = subtask.name || "Unnamed Task"; // ✅ Ensure it's always a string
            return {
                taskId: `task-${index + 1}`,
                taskName: taskName,
                taskType: determineTaskType(taskName), // ✅ Always passing a string
                description: subtask.description || JSON.stringify(subtask.details || {})
            };
        });

        console.log("✅ Enhanced Subtasks:", enhancedSubtasks);
        return enhancedSubtasks;
    } catch (error) {
        console.error("❌ Error parsing goal:", error.message);
        return { error: "Failed to parse goal." };
    }
}

function determineTaskType(taskName) {
    if (typeof taskName !== "string") {
        console.error("🚨 Task name is not a string:", taskName);
        return "unknown";  // ✅ Return a default value
    }

    const keywords = {
        fetchData: ["Identify", "Gather", "Retrieve", "Fetch", "Extract", "Collect"],
        processData: ["Sort", "Organize", "Clean", "Structure", "Filter", "Categorize", "Compile"],
        analyzeData: ["Calculate", "Analyze", "Evaluate", "Compare", "Assess"],
        generateReport: ["Prepare", "Compile", "Summarize", "Draft", "Review", "Finalize", "Submit", "Adjust", "Conclusions", "Recommendations"]
    };

    for (const [taskType, words] of Object.entries(keywords)) {
        if (words.some(word => taskName.toLowerCase().includes(word.toLowerCase()))) {
            return taskType;
        }
    }

    return "processData"; // Default task type
}

module.exports = { parseGoal };

