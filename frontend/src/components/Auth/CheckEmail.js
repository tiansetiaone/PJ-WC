import React from 'react';
import { useNavigate } from 'react-router-dom';

const CheckEmail = () => {
  const navigate = useNavigate();

  return (
    <div className="flex h-screen">
      <div className="w-1/2 bg-blue-900 text-white flex flex-col justify-center items-center p-8">
        <img src="/logo.png" alt="Logo" className="mb-4" />
        <h1 className="text-2xl font-bold">Let's Grow Your Business with Us</h1>
      </div>
      <div className="w-1/2 bg-gray-100 flex flex-col justify-center items-center p-12">
        <h2 className="text-xl font-bold mb-4">Link Verification Sent</h2>
        <p className="text-center text-gray-600 mb-6">
          We have sent a verification link to the email address associated with your account.
          Please check your inbox or spam folder.
        </p>
        <img src="/images/email-sent.png" alt="Email Sent" className="mb-6" />
        <button
          className="bg-blue-700 text-white py-2 px-6 rounded"
          onClick={() => navigate('/')}
        >
          Check Your Email
        </button>
      </div>
    </div>
  );
};

export default CheckEmail;
