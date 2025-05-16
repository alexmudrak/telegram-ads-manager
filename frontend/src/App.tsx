import { AdMessageGenerator } from './components/AdMessageGenerator';
import { CreateAdForm } from './components/CreateAdForm';
import { SelectChannels } from './components/SelectChannels';
import { loadFromStorage, saveToStorage } from './utils/storage';
import { useEffect, useState } from 'react';

const App = () => {
  const [channels, setChannels] = useState<string>(() =>
    loadFromStorage('channels', ''),
  );
  const [generatedAdMeddsge, setGeneratedAdMessage] = useState<string>('');
  const [error, setError] = useState<string>('');

  useEffect(() => {
    saveToStorage('channels', channels);
  }, [channels]);

  return (
    <div className='min-h-screen bg-base-200 p-10'>
      <h1 className='text-3xl font-bold mb-6 text-center'>
        Telegram Ads Manager
      </h1>

      {error && <p className='text-red-500'>{error}</p>}

      <SelectChannels
        channels={channels}
        setChannels={setChannels}
        setError={setError}
      />

      <AdMessageGenerator
        channels={channels}
        generatedAdMessage={generatedAdMeddsge}
        setGeneratedAdMessage={setGeneratedAdMessage}
        setError={setError}
      />

      <CreateAdForm
        channels={channels}
        adText={generatedAdMeddsge}
        setError={setError}
      />
    </div>
  );
};

export default App;
