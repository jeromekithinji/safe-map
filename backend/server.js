import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import crimes from '../src/assets/data/crime_data_2025.json' assert { type: "json" }

dotenv.config()

const app = express()
const PORT = process.env.PORT || 5000

app.use(cors())
app.use(express.json())

app.get('/', (req, res) => {
  res.send('SafeMap Backend Running 🚀')
})

app.get('/api/crimes', (req, res) => {
  res.json(crimes)
})

app.listen(PORT, () => console.log(`Server running on port ${PORT}`))
