import { Routes, Route } from 'react-router-dom'
import { HomePage } from '@/pages/HomePage'
import { RetroPage } from '@/pages/RetroPage'
import { CreateRetroPage } from '@/pages/CreateRetroPage'
import './App.css'

export function App() {
  return (
    <div className="App">
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/create" element={<CreateRetroPage />} />
        <Route path="/retro/:id" element={<RetroPage />} />
      </Routes>
    </div>
  )
}