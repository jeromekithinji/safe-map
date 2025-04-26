import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import axios from 'axios'
import crimes from '../src/assets/data/filtered2010-2025.json' assert { type: "json" }

dotenv.config()

const app = express()
const PORT = process.env.PORT || 5000

app.use(cors())
app.use(express.json())

// Routes
app.get('/', (req, res) => {
  res.send('SafeMap Backend Running 🚀')
})

app.get('/api/crimes', (req, res) => {
  res.json(crimes)
})

// ➡️ New Route to Call Google Maps Geocoding API (Example)
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
          key: process.env.GOOGLE_MAPS_API_KEY, // Securely using your key!
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