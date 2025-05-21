import React from 'react';
import { useNavigate } from 'react-router-dom';

const ComingSoon = ({ title }) => {
  const navigate = useNavigate();
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
      <button
        className="mb-4 text-blue-600 underline text-sm"
        onClick={() => navigate(-1)}
      >
        ← Back
      </button>
      <h2 className="text-2xl font-bold mb-4">{title}</h2>
      <p className="text-gray-500">This module is under development. Please check back soon!</p>
    </div>
  );
};

export default ComingSoon;
