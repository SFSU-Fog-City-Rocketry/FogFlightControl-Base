import './Tailwind.css';
import Home from './pages/Home';
import { useState } from 'react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import Layout from './Layout';
import PluginManagement from './pages/PluginManagement';

function App() {
  const [count, setCount] = useState(0)

  return (
    <BrowserRouter>
      <Routes>
      <Route element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="plugin-management" element={<PluginManagement />} />
          </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App
