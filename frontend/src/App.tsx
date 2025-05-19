import { AdMessageGenerator } from './components/AdMessageGenerator';
import { CreateAdForm } from './components/CreateAdForm';
import { SelectChannels } from './components/SelectChannels';
import { loadFromStorage, saveToStorage } from './utils/storage';
import { useEffect, useState } from 'react';
import { TriangleAlertIcon, Info, CircleX, CircleCheck } from 'lucide-react';

interface ToastState {
  show: boolean;
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
}

const App = () => {
  const [channels, setChannels] = useState<string[]>(() =>
    loadFromStorage('channels', []),
  );
  const [generatedAdMeddsge, setGeneratedAdMessage] = useState<string>('');
  const [toast, setToast] = useState<ToastState>({
    show: false,
    message: '',
    type: 'info',
  });

  const showToast = (
    message: string,
    type: ToastState['type'] = 'info',
    duration: number = 3000,
  ) => {
    setToast({ show: true, message, type });
    setTimeout(() => {
      setToast({ show: false, message: '', type: 'info' });
    }, duration);
  };

  const getToastClasses = (type: ToastState['type']) => {
    switch (type) {
      case 'success':
        return 'alert-success';
      case 'error':
        return 'alert-error';
      case 'warning':
        return 'alert-warning';
      case 'info':
      default:
        return 'alert-info';
    }
  };

  useEffect(() => {
    saveToStorage('channels', channels);
  }, [channels]);

  return (
    <div className='min-h-screen bg-base-200 p-10'>
      <h1 className='text-3xl font-bold mb-6 text-center'>
        Telegram Ads Manager
      </h1>

      {toast.show && (
        <div className={`toast toast-top toast-center min-w-max z-999`}>
          <div className={`alert ${getToastClasses(toast.type)} shadow-lg`}>
            <div>
              {toast.type === 'success' && (
                <CircleCheck size={16} />
              )}
              {toast.type === 'error' && (
                <CircleX size={16} />
              )}
              {toast.type === 'warning' && (
                <TriangleAlertIcon size={16} />
              )}
              {toast.type === 'info' && (
                <Info size={16} />
              )}

              <span dangerouslySetInnerHTML={{ __html: toast.message }} />
            </div>
          </div>
        </div>
      )}

      <SelectChannels
        channels={channels}
        setChannels={setChannels}
        showToast={showToast}
      />

      <AdMessageGenerator
        channels={channels}
        generatedAdMessage={generatedAdMeddsge}
        setGeneratedAdMessage={setGeneratedAdMessage}
        showToast={showToast}
      />

      <CreateAdForm
        channels={channels}
        adText={generatedAdMeddsge}
        showToast={showToast}
      />
    </div>
  );
};

export default App;
