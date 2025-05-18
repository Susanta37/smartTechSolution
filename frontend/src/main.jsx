import React from 'react';
import ReactDOM from 'react-dom/client';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import { I18nextProvider } from 'react-i18next';
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import enTranslation from './assets/translations/en.json';
import odTranslation from './assets/translations/od.json';
import App from './App.jsx';
import store from './redux/store';
import './index.css';

i18n.use(initReactI18next).init({
  resources: {
    en: { translation: enTranslation },
    od: { translation: odTranslation },
  },
  lng: 'en',
  fallbackLng: 'en',
  interpolation: { escapeValue: false },
});
// console.log('VITE_API_URL:', import.meta.env.VITE_API_URL);
ReactDOM.createRoot(document.getElementById('root')).render(
  <Provider store={store}>
    <BrowserRouter>
      <I18nextProvider i18n={i18n}>
        <App />
      </I18nextProvider>
    </BrowserRouter>
  </Provider>
);