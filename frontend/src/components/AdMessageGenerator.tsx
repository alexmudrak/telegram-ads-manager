import * as api from '../api/api';
import { loadFromStorage, saveToStorage } from '../utils/storage';
import { useCallback, useEffect, useState } from 'react';

interface AdMessageGeneratorProps {
  channels: string[];
  generatedAdMessage: string;
  setGeneratedAdMessage: (message: string) => void;
  showToast: (
    message: string,
    type: 'success' | 'error' | 'info' | 'warning',
  ) => void;
}

export const AdMessageGenerator: React.FC<AdMessageGeneratorProps> = ({
  channels,
  generatedAdMessage,
  setGeneratedAdMessage,
  showToast,
}) => {
  const [adProductDesc, setAdProductDesc] = useState<string>(() =>
    loadFromStorage('ad_product_desc', ''),
  );

  const generateAdMessage = useCallback(async () => {
    if (channels.length < 1 || !adProductDesc.trim()) {
      showToast('Please fill all field', 'error');
      return;
    }

    try {
      const channelNames = channels;
      const result = await api.generateAdMessage(channelNames, adProductDesc);
      setGeneratedAdMessage(result.ad_message);
    } catch (error) {
      showToast(
        `Error generating ad message: ${(error as Error).message}`,
        'error',
      );
    }
  }, [channels, adProductDesc, showToast, setGeneratedAdMessage]);

  useEffect(() => {
    saveToStorage('ad_product_desc', adProductDesc);
  }, [adProductDesc]);

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
