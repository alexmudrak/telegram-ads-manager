import React from 'react';

interface FloatingTextareaProps {
  value: string;
  onChange: (value: string) => void;
  onFetchSimilar: () => void;
  onClear: () => void;
}

export const FloatingTextarea: React.FC<FloatingTextareaProps> = ({
  value,
  onChange,
  onFetchSimilar,
  onClear,
}) => {
  return (
    <div className='fixed top-5 left-15 z-50 bg-base-200 p-1 rounded shadow-lg w-5/6 border-gray-500 border-1'>
      <textarea
        className='textarea textarea-border w-full'
        placeholder='Base class'
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
      <div className='flex gap-2 my-2'>
        <button
          className='btn btn-sm btn-primary flex-1'
          onClick={onFetchSimilar}
        >
          Get similar channels
        </button>
        <button className='btn btn-sm btn-error flex-1' onClick={onClear}>
          Clear
        </button>
      </div>
    </div>
  );
};
