import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { StoreProvider } from './context/StoreContext';
import { ProductsProvider } from './context/ProductsContext';
import './index.css';
import './debug-overflow';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <StoreProvider>
        <ProductsProvider>
          <App />
        </ProductsProvider>
      </StoreProvider>
    </BrowserRouter>
  </React.StrictMode>
);
