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
      <h2 className='text-xl font-semibold'>2. Generate Ad Message</h2>

      <label className='floating-label my-4'>
        <span>Product description</span>
        <textarea
          className='textarea w-full'
          placeholder='Product description'
          value={adProductDesc}
          onChange={(e) => setAdProductDesc(e.target.value)}
        />
        </label>

      <label className='floating-label my-4'>
        <span>Generated Ad message</span>
        <textarea
          className='textarea w-full'
          placeholder='Ad message'
          value={generatedAdMessage}
          onChange={(e) => setGeneratedAdMessage(e.target.value)}
        />
      </label>

      <button
        className='btn btn-outline w-full my-1'
        onClick={generateAdMessage}
      >
        Generate Ad Message
      </button>
    </div>
  );
};
