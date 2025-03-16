const axios = require("axios");
const { parseGoal } = require("./goalParser");

const TASK_ENDPOINTS = {
    fetchData: "http://localhost:5000/fetch-salesforce-data",
    processData: "http://localhost:5000/process-data",
    analyzeData: "http://localhost:5000/analyze-data",
    generateReport: "http://localhost:5000/generate-report"
};

// ✅ Extract Quarter & Year from Goal
function extractQuarterAndYear(goal) {
    const quarterMatch = goal.match(/Q([1-4])/i);
    const yearMatch = goal.match(/\b(20\d{2})\b/);

    return {
        quarter: quarterMatch ? `Q${quarterMatch[1]}` : null,
        year: yearMatch ? yearMatch[0] : null
    };
}

async function executeGoal(goal) {
    console.log(`🚀 Received Goal: "${goal}"`);

    // Extract Quarter & Year
    const { quarter, year } = extractQuarterAndYear(goal);
    if (!quarter || !year) {
        console.error("❌ Missing Quarter or Year in Goal:", goal);
        return { error: "Invalid goal. Please specify a quarter (Q1-Q4) and year (e.g., 2024)." };
    }

    console.log(`📆 Extracted Quarter: ${quarter}, Year: ${year}`);

    // Generate subtasks
    let subtasks = await parseGoal(goal);

    if (!Array.isArray(subtasks)) {
        console.error("🚨 OpenAI did not return valid subtasks:", subtasks);
        return { error: "Failed to parse goal into valid subtasks." };
    }

    // Ensure at least one "fetchData" task exists
    const hasFetchData = subtasks.some(task => task.taskType === "fetchData");
    if (!hasFetchData) {
        console.warn("⚠️ No 'fetchData' subtask detected. Adding it manually...");
        subtasks.unshift({
            taskId: "task-fetch",
            taskName: "Fetch Salesforce Data",
            taskType: "fetchData",
            quarter,
            year
        });
    }

    // Inject Quarter & Year into all tasks
    subtasks.forEach(task => {
        task.quarter = quarter;
        task.year = year;
    });

    console.log("✅ Final Subtasks to Execute:", JSON.stringify(subtasks, null, 2));

    const results = await executeSubtasks(subtasks);
    return { message: "Goal execution completed", results };
}

async function executeSubtasks(subtasks) {
    const results = [];

    for (const task of subtasks) {
        const endpoint = TASK_ENDPOINTS[task.taskType];

        if (!endpoint) {
            console.error(`❌ No endpoint found for task type: ${task.taskType}`);
            results.push({ result: "Failed", error: `No endpoint found for task type: ${task.taskType}` });
            continue; // Skip this task and move to the next
        }

        try {
            console.log(`📡 Executing task: ${task.taskName} (${task.taskType}) at ${endpoint}`);
            const response = await axios.post(endpoint, task);
            results.push({ result: "Success", data: response.data });
        } catch (error) {
            console.error(`❌ Error executing ${task.taskType}:`, error.message);
            results.push({ result: "Failed", error: error.message });
        }
    }

    return results;
}

module.exports = { executeGoal, executeSubtasks };


