'use client';
import { useState } from 'react';

export default function Banner() {
  const [visible, setVisible] = useState(true);
  if (!visible) return null;

  return (  // the first affirmation
    <div className="bg-blue-900 text-white p-4 text-center relative animate-slideDown z-50 shadow-md">
      <p>Welcome to Yapp. Share your affirmation story!</p> 
      <button
        onClick={() => setVisible(false)}
        className="absolute right-4 top-2 text-white text-xl font-bold"
      >
        &times;
      </button>
    </div>
  );
}