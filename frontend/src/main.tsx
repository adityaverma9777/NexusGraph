import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import cytoscape from 'cytoscape'
import coseBilkent from 'cytoscape-cose-bilkent'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter } from 'react-router-dom'
import 'leaflet/dist/leaflet.css'
import './index.css'
import App from './App.tsx'

const queryClient = new QueryClient()

// Register Cytoscape layout plugins before any Cytoscape components mount
cytoscape.use(coseBilkent)

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </QueryClientProvider>
  </StrictMode>,
)
