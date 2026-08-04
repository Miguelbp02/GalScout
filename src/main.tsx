import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import 'bootstrap/dist/css/bootstrap.min.css'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App.tsx'
import { ToastProvider } from './components/ToastProvider.tsx'
import { MatchSessionProvider } from './components/MatchSessionProvider.tsx'
import { ModoJugadoresProvider } from './components/ModoJugadoresProvider.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <ToastProvider>
        <ModoJugadoresProvider>
          <MatchSessionProvider>
            <App />
          </MatchSessionProvider>
        </ModoJugadoresProvider>
      </ToastProvider>
    </BrowserRouter>
  </StrictMode>,
)
