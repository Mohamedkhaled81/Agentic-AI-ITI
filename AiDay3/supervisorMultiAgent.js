import "dotenv/config";
import { ChatOpenAI } from "@langchain/openai";

const model = new ChatOpenAI({
    model: "gpt-5-mini", 
    apiKey: process.env.OPENAI_KEY,
});

// --- Specialized Agents ---

async function planningAgent(query) {
    const response = await model.invoke(`
        You are a Travel Planner. Break down this request into a logical itinerary: "${query}".
        Focus on: Destination, dates, and the sequence of travel.
    `);
    return { plan: response.content };
}

async function flightAgent(plan) {
    const response = await model.invoke(`
        You are a Flight Expert. Based on this plan: "${plan}", 
        suggest 3 flight options (Airlines, approximate prices, and duration).
    `);
    return { flights: response.content };
}

async function hotelAgent(plan, reviews) {
    const response = await model.invoke(`
        You are a Hotel Specialist. Based on the plan and these reviews: "${reviews}",
        recommend 2-3 hotels that match the budget and vibe.
    `);
    return { hotels: response.content };
}

async function reviewsAgent(topic) {
    const response = await model.invoke(`
        You are a Review Analyst. Search your knowledge for sentiments and 
        ratings regarding: "${topic}". Provide a summary of pros and cons.
    `);
    return { reviews: response.content };
}

// --- The Coordinator (Supervisor) ---

async function travelSupervisor(userRequest) {
    console.log("--- Supervisor: Orchestrating Travel Workflow ---");

    // 1. Planning phase
    console.log("Step 1: Planning...");
    const { plan } = await planningAgent(userRequest);

    // 2. Intelligence gathering (Reviews)
    console.log("Step 2: Analyzing Reviews...");
    const { reviews } = await reviewsAgent(plan);

    // 3. Execution (Flights & Hotels in parallel)
    console.log("Step 3: Finding Flights and Hotels...");
    const [flightData, hotelData] = await Promise.all([
        flightAgent(plan),
        hotelAgent(plan, reviews)
    ]);

    // 4. Final Aggregation
    console.log("Step 4: Compiling Final Response...");
    const finalResponse = await model.invoke(`
        You are the Head Travel Concierge. 
        Combine the following data into a beautiful, cohesive travel package for the user.
        
        Plan: ${plan}
        Reviews Summary: ${reviews}
        Flight Options: ${flightData.flights}
        Hotel Options: ${hotelData.hotels}
        
        User Request: ${userRequest}
    `);

    return finalResponse.content;
}

// --- Execution ---
async function main() {
    const task = "I want to plan a 5-day trip to italy in 15 of October. I love luxury hotels but want to find affordable business class flights total budget is 2000 dollar flying from cairo .";
    const result = await travelSupervisor(task);
    console.log("\n========== YOUR ITINERARY ==========\n");
    console.log(result);
}

main();