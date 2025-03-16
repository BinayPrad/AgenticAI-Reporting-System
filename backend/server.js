const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const axios = require("axios");
require("dotenv").config(); // Load environment variables

const { executeGoal } = require("./agents/orchestrator");

const app = express();
const PORT = 5000;

// 🔹 Enable CORS for frontend
app.use(cors({
    origin: "http://localhost:3000", // Allow frontend origin
    methods: ["GET", "POST", "OPTIONS"], // Allowed methods
    allowedHeaders: ["Content-Type", "Authorization"] // Allowed headers
}));

app.use(bodyParser.json());

// 👉 **Fetch Salesforce data**
app.post("/fetch-salesforce-data", async (req, res) => {
    try {
        console.log("🔍 Fetching Salesforce data...");
        const { quarter, year } = req.body;

        if (!quarter || !year) {
            return res.status(400).json({ error: "Quarter and Year are required." });
        }

        const powerAutomateURL = process.env.POWER_AUTOMATE_URL;
        if (!powerAutomateURL) throw new Error("Missing Power Automate URL in .env");

        const response = await axios.post(powerAutomateURL, { quarter, year });

        if (!response.data || !response.data.records) {
            throw new Error("Invalid response format from Power Automate");
        }

        res.json({ success: true, data: response.data });
    } catch (error) {
        console.error("❌ Error fetching Salesforce data:", error.message);
        res.status(500).json({ error: "Failed to fetch Salesforce data." });
    }
});

// 👉 **Analyze Data**
app.post("/analyze-data", async (req, res) => {
    try {
        console.log("📊 Analyzing data...", req.body);
        // Simulate analysis process
        res.json({ success: true, message: "Data analyzed successfully" });
    } catch (error) {
        console.error("❌ Error analyzing data:", error.message);
        res.status(500).json({ error: "Failed to analyze data." });
    }
});

// 👉 **Generate Report**
app.post("/generate-report", async (req, res) => {
    try {
        console.log("📄 Generating report...", req.body);
        // Simulate report generation
        res.json({ success: true, message: "Report generated successfully" });
    } catch (error) {
        console.error("❌ Error generating report:", error.message);
        res.status(500).json({ error: "Failed to generate report." });
    }
});

// 👉 **Process Data (Final Step)**
app.post("/process-data", async (req, res) => {
    try {
        console.log("📡 Processing final data...", req.body);
        // Simulate final data processing
        res.json({ success: true, message: "Data processing completed successfully" });
    } catch (error) {
        console.error("❌ Error processing data:", error.message);
        res.status(500).json({ error: "Failed to process data." });
    }
});

// 👉 **New Route: Execute Goal** 
app.post("/execute-goal", async (req, res) => {
    try {
        console.log("🎯 Received Goal:", req.body.goal);

        if (!req.body.goal) {
            return res.status(400).json({ error: "Goal is required." });
        }

        const result = await executeGoal(req.body.goal);
        res.json({ success: true, results: result });
    } catch (error) {
        console.error("❌ Error executing goal:", error.message);
        res.status(500).json({ error: "Failed to execute goal." });
    }
});

// Start the server
app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
});
