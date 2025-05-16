import React from 'react';

interface FloatingTextareaProps {
  value: string;
  onChange: (value: string) => void;
  onFetchSimilar?: () => void;
  onClear: () => void;
}

export const FloatingTextarea: React.FC<FloatingTextareaProps> = ({
  value,
  onChange,
  onFetchSimilar,
  onClear,
}) => {
  return (
    <div className='fixed top-1/6 left-1/2 z-50 bg-base-200 p-4 pb-0 rounded shadow-lg w-230 transform -translate-x-1/2 -translate-y-1/2 border border-gray-600'>
      <label className='floating-label'>
        <span>Channels to Ad</span>
        <textarea
          className='textarea textarea-border w-full'
          placeholder='Channels to Ad'
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      </label>
      <div className='flex gap-2 my-2'>
        {onFetchSimilar && (
          <button
            className='btn btn-sm btn-primary flex-1'
            onClick={onFetchSimilar}
          >
            Get similar channels
          </button>
        )}
        <button className='btn btn-sm btn-error flex-1' onClick={onClear}>
          Clear
        </button>
      </div>
    </div>
  );
};
