import * as api from '../api/api';
import { Channel } from '../types/types';
import { loadFromStorage } from '../utils/storage';
import Channels from './Channels';
import { Modal } from './Modal';
import { SelectChannelsTextarea } from './SelectChannelsTextarea';
import { useCallback, useState } from 'react';

interface SelectChannelsProps {
  channels: string[];
  setChannels: (channel: string[]) => void;
  showToast: (
    message: string,
    type: 'success' | 'error' | 'info' | 'warning',
  ) => void;
}
export const SelectChannels: React.FC<SelectChannelsProps> = ({
  channels,
  setChannels,
  showToast,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [channelsList, setChannelsList] = useState<Channel[]>([]);

  const fetchAllChannels = useCallback(async () => {
    setChannelsList([]);
    setIsModalOpen(true);
  }, []);

  const fetchSimilarChannels = useCallback(async () => {
    if (!channels) {
      showToast('Please fill all fields', 'error');
      return;
    }

    try {
      setChannelsList([]);

      const channelNames = channels;
      const data = await api.fetchSimilarChannels(channelNames);
      setChannelsList(data);
      setIsModalOpen(true);
    } catch (error) {
      showToast(
        `Error fetching similar channels: ${(error as Error).message}`,
        'error',
      );
    }
  }, [channels, showToast]);

  return (
    <div className='grid grid-cols-1 gap-4 mb-6'>
      <h2 className='text-xl font-semibold'>1. Select Channels</h2>

      <SelectChannelsTextarea channels={channels} setChannels={setChannels} />

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
          setChannels(loadFromStorage('channels', []));
          setIsModalOpen(false);
        }}
      >
        <Channels
          channels={channels}
          setChannels={setChannels}
          channelsList={channelsList.length > 0 ? channelsList : undefined}
          isFilter={channelsList.length > 0 ? false : true}
        />
      </Modal>
    </div>
  );
};
