import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './App.css';
import { registerSW } from 'virtual:pwa-register';

if (typeof window !== 'undefined') {
  registerSW({ immediate: true });
}

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
