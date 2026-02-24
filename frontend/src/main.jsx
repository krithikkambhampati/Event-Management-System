import { createRoot } from 'react-dom/client'
import { BrowserRouter } from "react-router-dom";
import { GoogleReCaptchaProvider } from "react-google-recaptcha-v3";
import App from './App.jsx'
import './styles/global.css'

const RECAPTCHA_SITE_KEY = import.meta.env.VITE_RECAPTCHA_SITE_KEY || "6LcbX3MsAAAAAOZ-TaRSeAJpIyqVcPija1Ws8iPA";

createRoot(document.getElementById('root')).render(
  <GoogleReCaptchaProvider reCaptchaKey={RECAPTCHA_SITE_KEY}>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </GoogleReCaptchaProvider>
)
