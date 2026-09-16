import React from 'react';
import {createRoot} from 'react-dom/client';
import WolfGame from '../components/game/WolfGame.jsx';
import '../app/globals.css';
createRoot(document.getElementById('root')).render(<WolfGame/>);
