import React from 'react';

interface AdMessageGeneratorProps {
  adProductDesc: string;
  setAdProductDesc: (desc: string) => void;
  generatedAdMessage: string;
  setGeneratedAdMessage: (message: string) => void;
  generateAdMessage: () => void;
}

export const AdMessageGenerator: React.FC<AdMessageGeneratorProps> = ({
  adProductDesc,
  setAdProductDesc,
  generatedAdMessage,
  setGeneratedAdMessage,
  generateAdMessage,
}) => {
  return (
    <div className='my-4'>
      <textarea
        className='textarea w-full my-2'
        placeholder='Product description'
        value={adProductDesc}
        onChange={(e) => setAdProductDesc(e.target.value)}
      />

      <textarea
        className='textarea w-full my-2'
        placeholder='Ad message'
        value={generatedAdMessage}
        onChange={(e) => setGeneratedAdMessage(e.target.value)}
      />

      <button
        className='btn btn-outline w-full my-1'
        onClick={generateAdMessage}
      >
        Generate Ad Message
      </button>
    </div>
  );
};
