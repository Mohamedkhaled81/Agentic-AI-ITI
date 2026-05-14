import express from 'express';
import cors from 'cors';
import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Use a helper function to clean AI output before parsing
const cleanJSON = (text) => text.replace(/```json|```/g, "").trim();

async function planningAgent(task) {
    // 1. Initialize the model with JSON response type
    const model = genAI.getGenerativeModel({ 
        model: "gemini-2.5-flash",
        generationConfig: { responseMimeType: "application/json" } 
    });

    // --- Phase 1: Planning ---
    const planPrompt = `Break this task into two steps: ${task}. Return JSON: {"steps": ["step1", "step2", ...]}`;
    const planResponse = await model.generateContent(planPrompt);
    const planText = cleanJSON(planResponse.response.text());
    
    const { steps } = JSON.parse(planText);
    console.log("Steps created:", steps);

    // --- Phase 2: Execution ---
    const results = [];
    for (const step of steps) {
        console.log(`Executing: ${step}`);
        const stepPrompt = `Execute this step: ${step}. Return JSON: {"result": "detailed answer for this step"}`;
        const stepRes = await model.generateContent(stepPrompt);
        const stepText = cleanJSON(stepRes.response.text());
        
        results.push({ step, result: JSON.parse(stepText).result });
    }

    // --- Phase 3: Summary ---
    // We switch back to normal text for the final report
    const summaryModel = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    const summaryPrompt = `Combine these results into a final cohesive report: ${JSON.stringify(results)}`;
    const summaryRes = await summaryModel.generateContent(summaryPrompt);
    
    return summaryRes.response.text();
}

app.post('/api/chat', async (req, res) => {
    try {
        const { prompt } = req.body;
        if (!prompt) return res.status(400).json({ error: "No prompt provided" });

        console.log("Agent started for task:", prompt);
        const report = await planningAgent(prompt);
        res.json({ report });
    } catch (error) {
        // Log the exact error to your terminal for debugging
        console.error("SERVER ERROR:", error.message);
        res.status(500).json({ 
            error: "Failed to generate plan", 
            details: error.message 
        });
    }
});

const PORT = 3000;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));