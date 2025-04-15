import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'
import LLMValidationApp from './LLMValidationApp'

function App() {
  const [count, setCount] = useState(0)

  return (
    <LLMValidationApp></LLMValidationApp>
  )
}

export default App;
