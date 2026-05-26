import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import { getRLInterface } from './rl/interface';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// Mount RL interface globally after a short delay to ensure store is initialized
setTimeout(() => {
  (window as any).__gridworld = getRLInterface();
  console.log('[3D GridWorld] RL interface ready: window.__gridworld');
}, 100);
