import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import QrSharePage from './components/QrSharePage.jsx'
import './index.css'

// Handle unhandled promise rejections and async errors
window.addEventListener('unhandledrejection', event => {
  console.warn('Unhandled promise rejection:', event.reason);
  // Don't prevent default for now, just log it
});

// Handle message channel errors gracefully
if (window.chrome?.runtime?.onMessage) {
  const originalOnMessage = chrome.runtime.onMessage;
  window.chrome.runtime.onMessage = function(message, sender, sendResponse) {
    try {
      const result = originalOnMessage.call(this, message, sender, sendResponse);
      // If handler returns promise, ensure it doesn't stay pending
      if (result instanceof Promise) {
        result.catch(err => console.warn('Message handler error:', err));
      }
    } catch (e) {
      console.warn('Message handling error:', e);
    }
  };
}

const isSharePage = window.location.pathname.startsWith('/share')

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    {isSharePage ? <QrSharePage /> : <App />}
  </React.StrictMode>,
)
