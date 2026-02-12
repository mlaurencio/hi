
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

// Suppress non-critical ResizeObserver loop limit errors
if (typeof window !== 'undefined') {
  const originalError = console.error;
  console.error = (...args) => {
    if (args[0]?.includes?.('ResizeObserver loop completed with undelivered notifications') || 
        args[0]?.includes?.('ResizeObserver loop limit exceeded')) {
      return;
    }
    originalError.apply(console, args);
  };
  
  window.addEventListener('error', (e) => {
    if (e.message.includes('ResizeObserver loop completed with undelivered notifications') ||
        e.message.includes('ResizeObserver loop limit exceeded')) {
      e.stopImmediatePropagation();
    }
  });
}

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
