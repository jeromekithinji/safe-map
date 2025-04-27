import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import axios from 'axios'
import crimes from '../src/assets/data/filtered2010-2025.json' assert { type: "json" }
import { GoogleGenAI } from "@google/genai";

dotenv.config()

const app = express()
const PORT = process.env.PORT || 5000
app.use(cors())
app.use(express.json())

const API_KEY = process.env.GEMINI_API_KEY;
const ai = new GoogleGenAI({ apiKey: "AIzaSyACPNhw7KYf055sUpb-82rvK3_zHfrvZmQ" });

app.get('/', (req, res) => {
  res.send('SafeMap Backend Running 🚀')
})

app.get('/api/crimes', (req, res) => {
  res.json(crimes)
})

async function askGemini(prompt) {
  const res = await ai.models.generateContent({
    model: "gemini-2.0-flash",
    contents: [{ role: "user", parts: [{ text: prompt }] }],
  });
  console.log(res);
  return res.candidates[0].content.parts[0].text;
}

function summarizeCrime(lat, lng, radiusKm = 1) {
  return `In the past year within ${radiusKm} km of (${lat.toFixed(4)},${lng.toFixed(4)}), 
    there have been 320 crimes, most commonly Mischief (45%) and Other Theft (30%).`;
}

app.post('/api/assistant', async (req, res) => {
  try {
    const { question, lat, lng, radiusKm } = req.body;
    const crimeContext = summarizeCrime(lat, lng, radiusKm);

    const prompt = `
You are a Montreal safety assistant. 
Context: ${crimeContext}
User asked: "${question}"

Give me clear advice about safety and areas to avoid.
`;
    const answer = await askGemini(prompt);
    res.json({ answer });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'internal error' });
  }
});


app.get('/api/geocode', async (req, res) => {
  const { address } = req.query

  if (!address) {
    return res.status(400).json({ error: 'Address query parameter is required' })
  }

  try {
    const response = await axios.get(
      `https://maps.googleapis.com/maps/api/geocode/json`,
      {
        params: {
          address,
          key: process.env.GOOGLE_MAPS_API_KEY,
        },
      }
    )

    res.json(response.data)
  } catch (error) {
    console.error('Error fetching from Google Maps:', error)
    res.status(500).json({ error: 'Failed to fetch data from Google Maps' })
  }
})

app.listen(PORT, () => console.log(`Server running on port ${PORT}`))