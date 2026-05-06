import React from 'react';
import ReactDOM from 'react-dom/client';
import { Provider } from 'react-redux';
import { store } from './state/store';
import GamePage from './ui/pages/GamePage';
import './ui/styles/global.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Provider store={store}>
      <GamePage />
    </Provider>
  </React.StrictMode>
);
