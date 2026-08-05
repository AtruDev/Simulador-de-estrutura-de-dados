import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { MotionConfig } from 'framer-motion';
import App from './App';
import './index.css';

const container = document.getElementById('root');
if (container === null) {
  throw new Error('Elemento #root não encontrado em index.html.');
}

createRoot(container).render(
  <StrictMode>
    {/* `reducedMotion="user"` respeita a preferência do sistema por menos animação. */}
    <MotionConfig reducedMotion="user">
      <App />
    </MotionConfig>
  </StrictMode>,
);
