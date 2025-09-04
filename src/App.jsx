import React, { useState, useEffect } from 'react';
import What2Cook from './What2Cook';
import PincodeGate from './components/PincodeGate';

const STORAGE_KEY = 'w2c_pincode_ok';

const App = () => {
  const [unlocked, setUnlocked] = useState(false);

  useEffect(() => {
    try {
      const ok = window.localStorage.getItem(STORAGE_KEY) === 'true';
      setUnlocked(ok);
    } catch (_) {
      setUnlocked(false);
    }
  }, []);

  const handleUnlock = () => {
    try { window.localStorage.setItem(STORAGE_KEY, 'true'); } catch (_) {}
    setUnlocked(true);
  };

  return unlocked ? <What2Cook /> : <PincodeGate onSuccess={handleUnlock} />;
};

export default App;
