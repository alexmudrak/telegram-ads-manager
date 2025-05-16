import * as api from '../api/api';
import { Channel } from '../types/types';
import { loadFromStorage } from '../utils/storage';
import Channels from './Channels';
import { Modal } from './Modal';
import { useCallback, useState } from 'react';

interface SelectChannelsProps {
  channels: string;
  setChannels: (channel: string) => void;
  setError: (error: string) => void;
}
export const SelectChannels: React.FC<SelectChannelsProps> = ({
  channels,
  setChannels,
  setError,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [channelsList, setChannelsList] = useState<Channel[]>([]);

  const fetchAllChannels = useCallback(async () => {
    setChannelsList([]);
    setIsModalOpen(true);
  }, []);

  const fetchSimilarChannels = useCallback(async () => {
    if (!channels.trim()) {
      setError('Please fill all fields');
      return;
    }

    try {
      setError('');
      setChannelsList([]);

      const channelNames = channels.split(',').map((c) => c.trim());
      const data = await api.fetchSimilarChannels(channelNames);
      setChannelsList(data);
      setIsModalOpen(true);
    } catch (error) {
      console.error('Error fetching similar channels:', error);
      setError((error as Error).message);
    }
  }, [channels, setError]);

  return (
    <div className='grid grid-cols-1 gap-4 mb-6'>
      <h2 className='text-xl font-semibold'>1. Select Channels</h2>

      <label className='floating-label'>
        <span>Channels to Ad</span>
        <textarea
          className='textarea w-full'
          placeholder='Channels to Ad'
          value={channels}
          onChange={(e) => setChannels(e.target.value)}
        />
      </label>

      <div className='flex gap-4'>
        <button
          className='btn btn-warning w-full flex-1'
          onClick={fetchAllChannels}
        >
          Open DB
        </button>

        <button
          className='btn btn-primary w-full flex-1'
          onClick={fetchSimilarChannels}
        >
          Find similar channels
        </button>
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setChannels(loadFromStorage('channels', ''));
          setIsModalOpen(false);
        }}
      >
        <Channels
          channelsList={channelsList.length > 0 ? channelsList : undefined}
          isFilter={channelsList.length > 0 ? false : true}
        />
      </Modal>
    </div>
  );
};
