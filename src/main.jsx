import './setup-react.js';
import '../tokens.css';
import '../components.jsx';
import '../data.jsx';
import '../Placeholder.jsx';
import '../SearchResultsScreen.jsx';

import React from 'react';
import { createRoot } from 'react-dom/client';

const Screen = window.SearchResultsScreen;

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Screen />
  </React.StrictMode>
);
