//
import OpenAI from "openai";
import dotenv from "dotenv";
import axios from "axios"; // call api
import nodemailer from "nodemailer";

dotenv.config();

const openai = new OpenAI({
  apiKey: process.env.openai_api_key,
});

async function sendEmailNotification(subject, text) {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS, 
    },
  });

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: process.env.EMAIL_USER,
    subject: subject,
    text: text,
  };

  await transporter.sendMail(mailOptions);
}
async function getWeather(city) {
  const API_KEY = "ad9c473491ffdde5640ed50e2d357c66";
  const url = `http://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${API_KEY}&units=metric`;
  const response = await axios.get(url);
  return {
    city: response.data.name,
    temperature: response.data.main.temp,
    description: response.data.weather[0].description,
  };
}

async function weatherAgent(userMessage) {
  // Step 1: Extract city using LLM
  const extractionResponse = await openai.chat.completions.create({
    model: "gpt-4o-mini", // Note: Changed from gpt-5-mini to a valid current model
    messages: [
      {
        role: "system",
        content: `Extract the city name from the user's request. Reply ONLY with JSON: { "city": "name" }`,
      },
      { role: "user", content: userMessage },
    ],
  });

  const city = JSON.parse(extractionResponse.choices[0].message.content).city;
  const weatherInfo = await getWeather(city);

  // Step 2: Generate a UNIQUE email message using the weather data
  const creativeResponse = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content: "You are a friendly personal assistant. Write a short, creative, and unique email body based on the weather provided. vary your tone each time (witty, poetic, professional, or energetic)."
      },
      { 
        role: "user", 
        content: `City: ${weatherInfo.city}, Temp: ${weatherInfo.temperature}°C, Condition: ${weatherInfo.description}` 
      },
    ],
  });

  const dynamicMessage = creativeResponse.choices[0].message.content;

  // Step 3: Send the notification with the generated text
  await sendEmailNotification(`Weather Update for ${weatherInfo.city}`, dynamicMessage);

  return weatherInfo;
}

console.log(await weatherAgent("What's the weather like in cairo?"));
