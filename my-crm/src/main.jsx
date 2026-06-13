import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import CRMApp from './app/CRMApp.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <CRMApp />
  </StrictMode>,
)
