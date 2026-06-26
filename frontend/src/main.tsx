import { StrictMode, useEffect, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AppShell } from './components/layout/AppShell'
import { HomePage } from './pages/HomePage'
import { TellPage } from './pages/TellPage'
import { CraftPage } from './pages/CraftPage'
import { ReadPage } from './pages/ReadPage'
import { ShelfPage } from './pages/ShelfPage'
import { initGuest } from './lib/api'
import './index.css'

function App() {
  const [ready, setReady] = useState(false)

  useEffect(() => {
    initGuest().finally(() => setReady(true))
  }, [])

  if (!ready) {
    return (
      <div className="min-h-screen bg-paper flex items-center justify-center">
        <p className="font-display italic text-accent animate-pulse-slow">Unwritten</p>
      </div>
    )
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppShell />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/tell" element={<TellPage />} />
          <Route path="/craft" element={<CraftPage />} />
          <Route path="/read/:id" element={<ReadPage />} />
          <Route path="/shelf" element={<ShelfPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
