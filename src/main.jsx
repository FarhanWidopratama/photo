import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import QrSharePage from './components/QrSharePage.jsx'
import './index.css'

const isSharePage = window.location.pathname.startsWith('/share')

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    {isSharePage ? <QrSharePage /> : <App />}
  </React.StrictMode>,
)
