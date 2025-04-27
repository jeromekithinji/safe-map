import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import axios from 'axios'
import crimes from '../src/assets/data/filtered2010-2025.json' assert { type: "json" }
import { GoogleGenAI } from "@google/genai";
import utm from 'utm';

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

function haversine(lat1, lng1, lat2, lng2) {
  const toRad = (v) => (v * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function summarizeCrime(lat, lng, radiusKm = 1) {
  const crimesInRadius = crimes.filter((c) => {
    if (!c.X || !c.Y) return false;
    const { latitude, longitude } = utm.toLatLon(+c.X, +c.Y, 10, 'N');
    const dist = haversine(lat, lng, latitude, longitude);
    return dist <= radiusKm;
  });

  const total = crimesInRadius.length;
  if (total === 0) {
    return {
      summary: `In the past year within ${radiusKm} km of (${lat.toFixed(4)},${lng.toFixed(4)}), no crimes were reported.`,
      crimeCount: 0
    };
  }

  const typeCounts = {};
  crimesInRadius.forEach((c) => {
    typeCounts[c.TYPE] = (typeCounts[c.TYPE] || 0) + 1;
  });

  const sortedTypes = Object.entries(typeCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3);

  const typeSummary = sortedTypes
    .map(([type, count]) => `${type} (${Math.round((count / total) * 100)}%)`)
    .join(" and ");

  return {
    summary: `In the past year within ${radiusKm} km, this area had ${total} crimes, most commonly ${typeSummary}.`,
    crimeCount: total
  };
}

app.post('/api/assistant', async (req, res) => {
  try {
    const { question, lat, lng, radiusKm, crimeCount } = req.body;
    let summary, count;

    if (crimeCount !== undefined && crimeCount !== null) {
      summary = `This neighborhood has ${crimeCount} crimes reported in the past year.`;
      count = crimeCount;
    } else {
      const result = summarizeCrime(lat, lng, radiusKm);
      summary = result.summary;
      count = result.crimeCount;
    }

    const SAFE_THRESHOLD = 200;
    const prompt = `
    You are a Vancouver safety assistant.
    Context: ${summary}
    Crime count in this area: ${count}
    If crime count is less than ${SAFE_THRESHOLD}, consider the area generally safe. If above but less than 600 advise caution. If above 600, advise extreme caution that this area is not safe.
    User asked: "${question}"

    Give me advice about safety according to the data coming from the Context, crime Count and user asked question.
    Give me the area name corresponding to the coordinates while answering to make your answer clearer.
    Keep your answer short and concise (max 5 sentences).
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