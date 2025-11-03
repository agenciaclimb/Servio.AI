import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { HelmetProvider } from 'react-helmet-async'
import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';
import App from './App'
import { AppProvider } from './contexts/AppContext'
import { ThemeProvider } from './contexts/ThemeContext';
import './index.css'

// Always provide a Stripe Elements context to avoid runtime crashes when some
// component calls useStripe/useElements at app startup. If the env var isn't
// set locally, fall back to Stripe's public demo key (safe for dev only).
const publishableKey = (import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY as string) 
  || 'pk_test_TYooMQauvdEDq54NiTphI7jx';
const stripePromise = loadStripe(publishableKey);
console.log('[Stripe] Using publishable key:', publishableKey ? publishableKey.slice(0, 12) + '...' : 'undefined');

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <HelmetProvider>
      <ThemeProvider>
        {/* Router must be outermost; Elements must wrap ANY component that uses Stripe hooks, including providers */}
        <BrowserRouter>
          <Elements stripe={stripePromise}>
            <AppProvider>
              <App />
            </AppProvider>
          </Elements>
        </BrowserRouter>
      </ThemeProvider>
    </HelmetProvider>
  </React.StrictMode>,
)