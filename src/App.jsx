import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import BigScreen from './pages/BigScreen';
import MobileEntry from './pages/MobileEntry';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<BigScreen />} />
        <Route path="/join" element={<MobileEntry />} />
      </Routes>
    </BrowserRouter>
  );
}
