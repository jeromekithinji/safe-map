import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'
import MapComponent from './components/MapComponent'

function App() {
  const [count, setCount] = useState(0)

  const fetchCrimes = async () => {
    const response = await fetch('http://localhost:5000/api/crimes')
    const data = await response.json()
    console.log(data)
  }

  fetchCrimes();


  return (
    <>
      <h1>The Safety Map</h1>
      <MapComponent />
    </>
  )
}

export default App