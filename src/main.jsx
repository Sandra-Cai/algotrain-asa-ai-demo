import { Buffer } from 'buffer'
import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import { DynamicProvider } from './lib/dynamicWallet'
import './styles/app.css'

window.Buffer = Buffer
globalThis.Buffer = Buffer

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <DynamicProvider>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </DynamicProvider>
  </React.StrictMode>,
)
