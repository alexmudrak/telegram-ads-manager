import * as api from '../api/api';
import { ChannelsTable } from '../components/ChannelsTable';
import { FilterButtons } from '../components/FilterButtons';
import { FloatingTextarea } from '../components/FloatingTextarea';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { useIntersectionObserver } from '../hooks/useIntersectionObserver';
import { Channel } from '../types/types';
import { loadFromStorage, saveToStorage } from '../utils/storage';
import { RefObject, useCallback, useEffect, useRef, useState } from 'react';

interface ChannelsProps {
  channelsList?: Channel[];
  isFilter?: boolean;
}

const Channels: React.FC<ChannelsProps> = ({
  channelsList: propChannelsList,
  isFilter: propIsFilter,
}) => {
  const [error, setError] = useState<string>('');
  const [isDataLoading, setIsDataLoading] = useState<boolean>(
    propChannelsList ? true : false,
  );
  const [channels, setChannels] = useState<string>(() =>
    loadFromStorage('channels', ''),
  );
  const [categories, setCategories] = useState<string[]>([]);
  const [geos, setGeos] = useState<string[]>([]);
  const [channelsList, setChannelsList] = useState<Channel[]>(
    propChannelsList || [],
  );
  const [filterCategory, setFilterCategory] = useState<string | null>(null);
  const [filterGeo, setFilterGeo] = useState<string | null>(null);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { isIntersecting } = useIntersectionObserver(
    textareaRef as RefObject<Element>,
  );

  const fetchChannelsByFilter = useCallback(async () => {
    try {
      setIsDataLoading(false);
      setError('');
      setChannelsList([]);

      const data = await api.fetchChannelsByFilter(filterCategory, filterGeo);
      setChannelsList(data.channels);
      setIsDataLoading(true);
    } catch (error) {
      console.error('Error fetching channels by filter:', error);
      setError((error as Error).message);
    }
  }, [filterCategory, filterGeo]);

  const handleCategoryClick = useCallback((category: string) => {
    setFilterCategory((prev) => (prev === category ? null : category));
  }, []);

  const handleGeoClick = useCallback((geo: string) => {
    setFilterGeo((prev) => (prev === geo ? null : geo));
  }, []);

  const handleUpdateChannelCategory = useCallback(
    async (channelId: number, category: string) => {
      try {
        await api.updateChannelCategory(channelId, category);

        setChannelsList((prev) =>
          prev.map((channel) =>
            channel.id === channelId ? { ...channel, category } : channel,
          ),
        );
      } catch (error) {
        console.error('Error updating category:', error);
      }
    },
    [],
  );

  const handleUpdateChannelGeo = useCallback(
    async (channelId: number, geo: string) => {
      try {
        await api.updateChannelGeo(channelId, geo);

        setChannelsList((prev) =>
          prev.map((channel) =>
            channel.id === channelId ? { ...channel, geo } : channel,
          ),
        );
      } catch (error) {
        console.log('Error updating geo:', error);
      }
    },
    [],
  );

  const updateChannelData = useCallback(async (id: number) => {
    try {
      setIsDataLoading(false);
      const updatedChannel = await api.fetchChannelData(id);

      setChannelsList((prev) =>
        prev.map((channel) => (channel.id === id ? updatedChannel : channel)),
      );
      setIsDataLoading(true);
    } catch (error) {
      console.error('Failed to update channel:', error);
      setError((error as Error).message);
    }
  }, []);

  const addChannelUsername = useCallback((username: string) => {
    setChannels((prev) => (prev ? `${prev}, ${username}` : username));
  }, []);

  const addAllUsernames = useCallback(() => {
    const usernames = channelsList
      .map((channel) => channel.username)
      .join(', ');
    setChannels(usernames);
  }, [channelsList]);

  useEffect(() => {
    saveToStorage('channels', channels);
  }, [channels]);

  useEffect(() => {
    const initializeData = async () => {
      try {
        const [categoriesData, geosData] = await Promise.all([
          api.fetchCategories(),
          api.fetchGeos(),
        ]);

        setCategories(categoriesData);
        setGeos(geosData);

        if (!propChannelsList) {
          fetchChannelsByFilter();
        }
      } catch (error) {
        console.log('Error initializing data:', error);
        setError('Initializing Error');
      }
    };
    initializeData();
  }, [fetchChannelsByFilter, propChannelsList]);

  return (
    <div className='min-h-screen bg-base-200 p-10'>
      <h1 className='text-3xl font-bold mb-6 text-center'>Telegram Channels</h1>

      {error && <p className='text-red-500'>{error}</p>}

      <label className='floating-label my-4'>
        <span>Channels to Ad</span>
        <textarea
          ref={textareaRef}
          className='textarea w-full'
          placeholder='Channels to Ad'
          value={channels}
          onChange={(e) => setChannels(e.target.value)}
        />
      </label>

      {!isIntersecting && (
        <FloatingTextarea
          value={channels}
          onChange={setChannels}
          onClear={() => {
            setChannels('');
          }}
        />
      )}

      {propIsFilter && (
        <FilterButtons
          categories={categories}
          geos={geos}
          filterCategory={filterCategory}
          filterGeo={filterGeo}
          onCategoryClick={handleCategoryClick}
          onGeoClick={handleGeoClick}
        />
      )}

      {isDataLoading ? (
        <ChannelsTable
          channelsList={channelsList}
          categories={categories}
          geos={geos}
          updateChannelCategory={handleUpdateChannelCategory}
          updateChannelGeo={handleUpdateChannelGeo}
          updateChannelData={updateChannelData}
          addChannelUsername={addChannelUsername}
          addAllUsernames={addAllUsernames}
        />
      ) : (
        <LoadingSpinner />
      )}
    </div>
  );
};

export default Channels;
