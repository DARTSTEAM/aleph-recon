import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App, { ErrorBoundary } from './App.jsx'
import { LanguageProvider } from './i18n/index.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary>
      <LanguageProvider>
        <App />
      </LanguageProvider>
    </ErrorBoundary>
  </StrictMode>,
)
