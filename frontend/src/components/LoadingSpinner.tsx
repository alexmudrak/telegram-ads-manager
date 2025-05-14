import React from 'react';

export const LoadingSpinner: React.FC = () => (
  <div className='flex justify-center items-center h-32'>
    <span className='loading loading-infinity loading-xl' />
  </div>
);
