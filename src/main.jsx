import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import QrSharePage from './components/QrSharePage.jsx'
import './index.css'

// Suppress message channel errors from extensions
window.addEventListener('unhandledrejection', event => {
  const message = event.reason?.message || String(event.reason);
  
  // Suppress common extension-related errors
  if (
    message.includes('message channel closed') ||
    message.includes('Extension context invalidated') ||
    message.includes('The message port closed before a response was received')
  ) {
    event.preventDefault();
    return;
  }
  
  console.warn('Unhandled rejection:', event.reason);
});

// Suppress rejectionhandled events
window.addEventListener('rejectionhandled', () => {
  // Just suppress it
});

// Suppress global errors from extensions
window.addEventListener('error', (event) => {
  const message = event.message || '';
  if (
    message.includes('message channel closed') ||
    message.includes('listener indicated an asynchronous response')
  ) {
    event.preventDefault();
    return false;
  }
}, true);

const isSharePage = window.location.pathname.startsWith('/share')

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    {isSharePage ? <QrSharePage /> : <App />}
  </React.StrictMode>,
)
