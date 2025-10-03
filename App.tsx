import React, { useEffect } from 'react'
import Home from './app/index'
import { checkUpdatesOnce } from './src/utils/updates-manager'

export default function App() {
  useEffect(() => {
    checkUpdatesOnce(true);
  }, []);

  return <Home />;
}