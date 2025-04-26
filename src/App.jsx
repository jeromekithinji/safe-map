import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'
import MapComponent from './components/MapComponent/MapComponent'
import NavBar from './components/NavBar/NavBar'

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
      <NavBar />
      <MapComponent />
    </>
  )
}

export default App
