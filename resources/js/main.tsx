import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter } from 'react-router-dom'
import { App } from './App'
import { getTelescopePath } from './lib/telescope'
import './styles.css'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      staleTime: 5_000,
    },
  },
})

const root = document.getElementById('eyepiece')
if (!root) {
  throw new Error('Eyepiece mount node #eyepiece not found')
}

createRoot(root).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter basename={getTelescopePath()}>
        <App />
      </BrowserRouter>
    </QueryClientProvider>
  </StrictMode>,
)
