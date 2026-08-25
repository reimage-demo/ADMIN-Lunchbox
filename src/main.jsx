import React from 'react'
import ReactDOM from 'react-dom/client'
import { ConvexProvider, ConvexReactClient } from 'convex/react'
import App from './App'
import AdminErrorBoundary from './components/AdminErrorBoundary'
import logo from './logo.webp'
import './styles.css'

const convexUrl = import.meta.env.VITE_CONVEX_URL
const root = ReactDOM.createRoot(document.getElementById('root'))

root.render(
  <React.StrictMode>
    <AdminErrorBoundary>
      {convexUrl ? (
        <ConvexProvider client={new ConvexReactClient(convexUrl)}>
          <App />
        </ConvexProvider>
      ) : (
        <main className="login-view login-simple">
          <section className="login-card">
            <img src={logo} alt="Lunch Box" />
            <p className="login-label">Lunch Box admin setup</p>
            <h1>Connect Convex</h1>
            <p className="login-intro">Add the new Lunch Box deployment URL to <code>admin-portal/.env.local</code> as <code>VITE_CONVEX_URL</code>, then restart the admin app.</p>
          </section>
        </main>
      )}
    </AdminErrorBoundary>
  </React.StrictMode>,
)
