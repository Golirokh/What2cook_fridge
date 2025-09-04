import React, { useEffect, useRef, useState } from 'react';
import HeaderHero from '../HeaderHero';

const CORRECT_PIN = '2974';

const PincodeGate = ({ onSuccess }) => {
  const [digits, setDigits] = useState(['', '', '', '']);
  const [error, setError] = useState('');
  const inputsRef = useRef([]);

  useEffect(() => {
    inputsRef.current[0]?.focus();
  }, []);

  const handleChange = (index, value) => {
    const v = value.replace(/\D/g, '').slice(0, 1);
    const next = [...digits];
    next[index] = v;
    setDigits(next);
    setError('');

    if (v && index < 3) {
      inputsRef.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      inputsRef.current[index - 1]?.focus();
    }
  };

  const submit = () => {
    const pin = digits.join('');
    if (pin.length < 4) {
      setError('Please enter the 4-digit pincode.');
      return;
    }
    if (pin === CORRECT_PIN) {
      onSuccess?.();
    } else {
      setError('Pincode is not correct.');
    }
  };

  const onPaste = (e) => {
    const text = (e.clipboardData.getData('text') || '').replace(/\D/g, '').slice(0, 4);
    if (!text) return;
    e.preventDefault();
    const next = text.split('');
    while (next.length < 4) next.push('');
    setDigits(next);
  };

  return (
    <div className="min-h-screen bg-[#FEFBF7]">
      <div className="max-w-5xl mx-auto px-4 py-8">
        <HeaderHero />
        <div className="px-4 pb-8">
          <div className="mx-auto max-w-2xl rounded-3xl bg-sky-50 p-10 shadow-sm ring-1 ring-slate-200 md:p-14 text-center">
            <div className="mx-auto w-16 h-16 rounded-full bg-teal-500 text-white grid place-items-center mb-6">
              <svg className="w-9 h-9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 3l3 3-3 3-3-3 3-3zm0 6v12"/><path d="M3 12h18"/></svg>
            </div>
            <h1 className="text-2xl md:text-3xl font-semibold text-gray-800 mb-2">Enter 4-digit Pincode</h1>
            <p className="text-gray-600 mb-8 text-sm md:text-base">Access is restricted. Please enter your pincode.</p>

            <div className="flex items-center justify-center gap-3 mb-6" onPaste={onPaste}>
              {[0,1,2,3].map((i) => (
                <input
                  key={i}
                  ref={(el) => (inputsRef.current[i] = el)}
                  value={digits[i]}
                  onChange={(e) => handleChange(i, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(i, e)}
                  inputMode="numeric"
                  pattern="[0-9]*"
                  className="w-14 h-16 md:w-16 md:h-20 text-center text-2xl md:text-3xl rounded-lg border border-gray-300 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 tracking-widest"
                  maxLength={1}
                />
              ))}
            </div>

            {error && (
              <div className="mb-6 text-red-600 text-sm font-medium">{error}</div>
            )}

            <button
              onClick={submit}
              className="px-6 py-3 text-sm font-medium text-white rounded-md transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 bg-blue-600 hover:bg-blue-700"
            >
              Continue
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PincodeGate;
