import * as api from './api/api';
import { AdMessageGenerator } from './components/AdMessageGenerator';
import { ChannelsTable } from './components/ChannelsTable';
import { CreateAdForm } from './components/CreateAdForm';
import { FilterButtons } from './components/FilterButtons';
import { FloatingTextarea } from './components/FloatingTextarea';
import { LoadingSpinner } from './components/LoadingSpinner';
import { Modal } from './components/Modal';
import { useIntersectionObserver } from './hooks/useIntersectionObserver';
import { Channel } from './types/types';
import { loadFromStorage, saveToStorage } from './utils/storage';
import { useCallback, useEffect, useRef, useState } from 'react';
import { RefObject } from 'react';

const App = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [channels, setChannels] = useState<string>(() =>
    loadFromStorage('channels', ''),
  );
  const [channelsList, setChannelsList] = useState<Channel[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [geos, setGeos] = useState<string[]>([]);
  const [error, setError] = useState<string>('');
  const [adProductDesc, setAdProductDesc] = useState<string>(() =>
    loadFromStorage('ad_product_desc', ''),
  );
  const [generatedAdMeddsge, setGeneratedAdMessage] = useState<string>('');
  const [filterCategory, setFilterCategory] = useState<string | null>(null);
  const [filterGeo, setFilterGeo] = useState<string | null>(null);
  const [isDataLoading, setIsDataLoading] = useState<boolean>(false);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { isIntersecting } = useIntersectionObserver(
    textareaRef as RefObject<Element>,
  );

  const handleCategoryClick = useCallback((category: string) => {
    setFilterCategory((prev) => (prev === category ? null : category));
  }, []);

  const handleGeoClick = useCallback((geo: string) => {
    setFilterGeo((prev) => (prev === geo ? null : geo));
  }, []);

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

  const fetchSimilarChannels = useCallback(async () => {
    if (!channels.trim()) {
      setError('Please fill all fields');
      return;
    }

    try {
      setIsDataLoading(false);
      setError('');
      setChannelsList([]);

      const channelNames = channels.split(',').map((c) => c.trim());
      const data = await api.fetchSimilarChannels(channelNames);
      setChannelsList(data);
      setIsDataLoading(true);
      setIsModalOpen(true);
    } catch (error) {
      console.error('Error fetching similar channels:', error);
      setError((error as Error).message);
    }
  }, [channels]);

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

  const clearChannels = useCallback(() => {
    setChannels('');
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

  const handleGenerateAdMessage = useCallback(async () => {
    if (!channels.trim() || !adProductDesc.trim()) {
      setError('Please fill all field');
      return;
    }

    try {
      const channelNames = channels.split(',').map((c) => c.trim());
      const result = await api.generateAdMessage(channelNames, adProductDesc);
      setGeneratedAdMessage(result.ad_message);
    } catch (error) {
      console.error('Error generating ad message:', error);
      setError((error as Error).message);
    }
  }, [channels, adProductDesc]);

  useEffect(() => {
    const initializeData = async () => {
      try {
        const [categoriesData, geosData] = await Promise.all([
          api.fetchCategories(),
          api.fetchGeos(),
        ]);

        setCategories(categoriesData);
        setGeos(geosData);

        fetchChannelsByFilter();
      } catch (error) {
        console.log('Error initializing data:', error);
        setError('Initializing Error');
      }
    };
    initializeData();
  }, [fetchChannelsByFilter]);

  useEffect(() => {
    saveToStorage('channels', channels);
    saveToStorage('ad_product_desc', adProductDesc);
  }, [channels, adProductDesc]);

  useEffect(() => {
    if (filterCategory || filterGeo) {
      fetchChannelsByFilter();
    }
  }, [filterCategory, filterGeo, fetchChannelsByFilter]);

  return (
    <div className='min-h-screen bg-base-200 p-10'>
      <h1 className='text-3xl font-bold mb-6 text-center'>
        Telegram Ads Manager
      </h1>

      <div className='grid grid-cols-1 gap-4 mb-6'>
        <h2 className='text-xl font-semibold'>1. Select Channels</h2>

        <label className='floating-label'>
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
            onFetchSimilar={fetchSimilarChannels}
            onClear={clearChannels}
          />
        )}

        {error && <p className='text-red-500'>{error}</p>}
        <button
          className='btn btn-primary w-full'
          onClick={fetchSimilarChannels}
        >
          Find similar channels
        </button>
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
        <FilterButtons
          categories={categories}
          geos={geos}
          filterCategory={filterCategory}
          filterGeo={filterGeo}
          onCategoryClick={handleCategoryClick}
          onGeoClick={handleGeoClick}
        />

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
      </Modal>

      <AdMessageGenerator
        adProductDesc={adProductDesc}
        setAdProductDesc={setAdProductDesc}
        generatedAdMessage={generatedAdMeddsge}
        setGeneratedAdMessage={setGeneratedAdMessage}
        generateAdMessage={handleGenerateAdMessage}
      />

      <CreateAdForm channels={channels} adText={generatedAdMeddsge} setError={setError} />
    </div>
  );
};

export default App;
