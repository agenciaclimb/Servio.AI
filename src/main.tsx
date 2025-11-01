import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';
import App from './App'
import { AppProvider } from './contexts/AppContext'
import { ThemeProvider } from './contexts/ThemeContext';
import './index.css'

const publishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY as string | undefined;
const stripePromise = publishableKey ? loadStripe(publishableKey) : null;

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <ThemeProvider>
      <AppProvider>
        <BrowserRouter>
          {stripePromise ? (
            <Elements stripe={stripePromise}>
              <App />
            </Elements>
          ) : (
            <App />
          )}
        </BrowserRouter>
      </AppProvider>
    </ThemeProvider>
  </React.StrictMode>,
)