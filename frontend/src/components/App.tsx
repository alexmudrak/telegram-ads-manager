import { useEffect, useRef, useState } from 'react';

const API_URL = 'http://127.0.0.1:8080';

function App() {
  const [channels, setChannels] = useState('');
  const [channelsList, setChannelsList] = useState<any[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [geos, setGeos] = useState<string[]>([]);
  const [error, setError] = useState('');
  const [generatedLinks, setGeneratedLinks] = useState('');
  const [adProductDesc, setAdProductDesc] = useState('');
  const [generatedAdMessage, setGeneratedAdMessage] = useState('');
  const [filterCategory, setFilterCategory] = useState(null);
  const [filterGeo, setFilterGeo] = useState(null);
  const [isTextareaOutOfView, setIsTextareaOutOfView] = useState(false);
  const [isDataLoading, setIsDataLoading] = useState(false);
  const textareaRef = useRef(null);

  useEffect(() => {
    const storedChannels = localStorage.getItem('channels');
    const storedAdProductDesc = localStorage.getItem('ad_product_desc');

    if (storedChannels) setChannels(storedChannels);
    if (storedAdProductDesc) setAdProductDesc(storedAdProductDesc);

    fetchCategories();
    fetchGeos();
    fetchChannelsByFilter();
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      setIsTextareaOutOfView(!entry.isIntersecting);
    });

    if (textareaRef.current) {
      observer.observe(textareaRef.current);
    }

    return () => {
      if (textareaRef.current) {
        observer.unobserve(textareaRef.current);
      }
    };
  }, []);

  useEffect(() => {
    localStorage.setItem('channels', channels);
    localStorage.setItem('ad_product_desc', adProductDesc);
  }, [channels, adProductDesc]);

  useEffect(() => {
    if (filterCategory || filterGeo) {
      fetchChannelsByFilter();
    }
  }, [filterCategory, filterGeo]);

  const handleCategoryClick = (category) => {
    if (filterCategory === category) {
      setFilterCategory(null);
    } else {
      setFilterCategory(category);
    }
  };

  const handleGeoClick = (geo) => {
    if (filterGeo === geo) {
      setFilterGeo(null);
    } else {
      setFilterGeo(geo);
    }
  };

  const fetchCategories = async () => {
    const response = await fetch(`${API_URL}/api/v1/categories/`);
    if (!response.ok) {
      console.error(
        `Ошибка при загрузке категорий: ${response.status} ${response.statusText}`,
      );
      return;
    }
    const data = await response.json();
    setCategories(data);
  };

  const fetchGeos = async () => {
    const response = await fetch(`${API_URL}/api/v1/geos/`);
    if (!response.ok) {
      console.error(
        `Ошибка при загрузке гео: ${response.status} ${response.statusText}`,
      );
      return;
    }
    const data = await response.json();
    setGeos(data);
  };

  const fetchSimilarChannels = async () => {
    if (!channels) {
      setError('Пожалуйста, заполните все поля');
      return;
    }

    setIsDataLoading(false);
    setError('');
    setChannelsList([]);

    const url = `${API_URL}/api/v1/channels/similar`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        channels_names: channels.split(',').map((c) => c.trim()),
      }),
    });

    if (!response.ok) {
      setError(`Ошибка: ${response.status} ${response.statusText}`);
      return;
    }

    const data = await response.json();
    setChannelsList(data);
    setIsDataLoading(true);
  };

  const fetchChannelsByFilter = async () => {
    setIsDataLoading(false);
    setError('');
    setChannelsList([]);

    const params = new URLSearchParams();

    if (filterCategory) {
      params.append('category', filterCategory);
    }

    if (filterGeo) {
      params.append('geo', filterGeo);
    }
    const url = `${API_URL}/api/v1/channels/?${params.toString()}`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      setError(`Ошибка: ${response.status} ${response.statusText}`);
      return;
    }

    const data = await response.json();
    setChannelsList(data.channels);
    setIsDataLoading(true);
  };

  const fetchChannelData = async (id: number) => {
    setIsDataLoading(false);
    const url = `${API_URL}/api/v1/channels/${id}/get-new-data`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      setError(`Ошибка: ${response.status} ${response.statusText}`);
      return;
    }

    const data = await response.json();
    setIsDataLoading(true);
    return data;
  };

  const addChannelUsername = (username: string) => {
    setChannels((prev) => (prev ? `${prev}, ${username}` : username));
  };

  const updateChannelData = async (id: number) => {
    try {
      const updatedChannel = await fetchChannelData(id);
      console.log(updatedChannel);

      setChannelsList((prev) =>
        prev.map((channel) => (channel.id === id ? updatedChannel : channel)),
      );
    } catch (error) {
      console.error('Failed to update channel:', error);
    }
  };

  const addAllUsernames = () => {
    setChannels('');
    channelsList.forEach((channel) => {
      addChannelUsername(channel.username);
    });
  };

  const clearChannels = () => {
    setChannels('');
  };

  const updateCategory = async (channelId: string, newCategory: string) => {
    const response = await fetch(
      `${API_URL}/api/v1/channels/${channelId}/category`,
      {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ category: newCategory }),
      },
    );

    if (!response.ok) {
      console.error(
        `Ошибка при обновлении категории: ${response.status} ${response.statusText}`,
      );
    }
  };

  const updateGeo = async (channelId: string, newGeo: string) => {
    const response = await fetch(
      `${API_URL}/api/v1/channels/${channelId}/geo`,
      {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ geo: newGeo }),
      },
    );

    if (!response.ok) {
      console.error(
        `Ошибка при обновлении гео: ${response.status} ${response.statusText}`,
      );
    }
  };

  const generateAdMessage = async () => {
    const response = await fetch(`${API_URL}/api/v1/ads/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        channels_names: channels.split(',').map((c) => c.trim()),
        description: adProductDesc,
      }),
    });

    if (!response.ok) {
      console.error(
        `Ошибка при генерации сообщения: ${response.status} ${response.statusText}`,
      );
      return;
    }

    const adMessage = await response.json();
    setGeneratedAdMessage(adMessage.ad_message);
  };

  const generateLinks = () => {
    const selectedChannelUsernames = channels
      .split(',')
      .map((name) => name.trim());

    const links = selectedChannelUsernames
      .map((username) => `https://t.me/${username}`)
      .join(', ');

    setGeneratedLinks(links);
  };

  return (
    <div className='min-h-screen bg-base-200 p-10'>
      <h1 className='text-3xl font-bold mb-6 text-center'>
        Получить похожие каналы
      </h1>
      <div className='grid grid-cols-1 gap-4 mb-6'>
        <textarea
          ref={textareaRef}
          className='textarea w-full'
          placeholder='Ваш базовый канал'
          value={channels}
          onChange={(e) => setChannels(e.target.value)}
        />

        {isTextareaOutOfView && channels && (
          <div className='fixed top-5 left-15 z-50 bg-base-200 p-1 rounded shadow-lg w-xl border-gray-500 border-1'>
            <textarea
              className='textarea textarea-bordered w-full'
              placeholder='Ваш базовый канал'
              value={channels}
              onChange={(e) => setChannels(e.target.value)}
            />
            <div className='flex gap-2 my-2'>
              <button
                className='btn btn-sm btn-error flex-1'
                onClick={clearChannels}
              >
                Очистить
              </button>
              <button
                className='btn btn-sm btn-primary flex-1'
                onClick={fetchSimilarChannels}
              >
                Получить похожие каналы
              </button>
            </div>
          </div>
        )}

        {error && <p className='text-red-500'>{error}</p>}
      </div>

      <div className='my-4'>
        <textarea
          className='textarea w-full'
          placeholder='Сгенерированные ссылки'
          value={generatedLinks}
          onChange={(e) => setGeneratedLinks(e.target.value)}
        />
        <button className='btn btn-outline w-full my-2' onClick={generateLinks}>
          Получить ссылки
        </button>
      </div>

      <div className='my-4'>
        <textarea
          className='textarea w-full my-2'
          placeholder='Описание рекламируемого продукта'
          value={adProductDesc}
          onChange={(e) => setAdProductDesc(e.target.value)}
        />

        <textarea
          className='textarea w-full my-2'
          placeholder='Рекламный текст'
          value={generatedAdMessage}
          onChange={(e) => setGeneratedAdMessage(e.target.value)}
        />

        <button
          className='btn btn-outline w-full my-2'
          onClick={generateAdMessage}
        >
          Генерировать рекламное сообщение
        </button>
      </div>

      <div className='my-4'>
        <button
          className='btn btn-primary w-full'
          onClick={fetchSimilarChannels}
        >
          Получить похожие каналы
        </button>

        <div className='flex flex-wrap justify-center my-4'>
          {geos.length > 0 ? (
            geos.map((geo, index) => (
              <button
                key={index}
                className={`btn mx-2 mb-2 ${filterGeo === geo ? 'btn-warning' : ''}`}
                onClick={() => handleGeoClick(geo)}
              >
                {`${geo.toUpperCase()}`}
              </button>
            ))
          ) : (
            <span>No Geos</span>
          )}
        </div>

        <div className='flex flex-wrap justify-center my-4'>
          {categories.length > 0 ? (
            categories.map((category, index) => (
              <button
                key={index}
                className={`btn mx-2 mb-2 ${filterCategory === category ? 'btn-warning' : ''}`}
                onClick={() => handleCategoryClick(category)}
              >
                {`${category.toUpperCase()}`}
              </button>
            ))
          ) : (
            <span>No categories</span>
          )}
        </div>

        {isDataLoading ? (
          <>
            <div>
              <button className='btn btn-sm btn-info' onClick={addAllUsernames}>
                Добавить все
              </button>
            </div>

            <div className='overflow-x-auto mt-6'>
              <table className='table w-full'>
                <thead>
                  <tr>
                    <th>#</th>
                    <th>ID</th>
                    <th>Фото</th>
                    <th>Название</th>
                    <th>Имя</th>
                    <th>Категория</th>
                    <th>Гео</th>
                    <th>Аудитория</th>
                    <th>Действие</th>
                  </tr>
                </thead>
                <tbody>
                  {channelsList.length > 0 ? (
                    channelsList.map((channel, index) => (
                      <tr key={channel.id} className='hover:bg-gray-800'>
                        <th>{index + 1}</th>
                        <th>{channel.id}</th>
                        <td>
                          <div
                            className='mask mask-squircle w-10'
                            data-tip={channel.description}
                            dangerouslySetInnerHTML={{
                              __html: channel.photo_element,
                            }}
                          />
                        </td>
                        <td
                          className='tooltip tooltip-right'
                          data-tip={channel.description}
                        >
                          <a
                            href={`https://t.me/s/${channel.username}`}
                            target='_blank'
                            rel='noopener noreferrer'
                          >
                            <span
                              dangerouslySetInnerHTML={{
                                __html: channel.title,
                              }}
                            />
                          </a>
                        </td>
                        <td>{channel.username}</td>
                        <td>
                          <select
                            defaultValue={channel.category}
                            className='select select-ghost'
                            onChange={(e) =>
                              updateCategory(channel.id, e.target.value)
                            }
                          >
                            <option disabled={true}>Выберите категорию</option>
                            {categories.map((category, index) => (
                              <option key={index} value={category}>
                                {category}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td>
                          <select
                            defaultValue={channel.geo || ''}
                            className='select select-ghost'
                            onChange={(e) =>
                              updateGeo(channel.id, e.target.value)
                            }
                          >
                            <option value='' disabled={true}>
                              Выберите гео
                            </option>
                            {geos.map((geo, index) => (
                              <option key={index} value={geo}>
                                {geo}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td>{channel.subscribers}</td>
                        <td>
                          <button
                            className='btn btn-sm btn-warning'
                            onClick={() => updateChannelData(channel.id)}
                          >
                            Обновить
                          </button>
                          <button
                            className='btn btn-sm btn-secondary'
                            onClick={() => addChannelUsername(channel.username)}
                          >
                            Добавить
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} className='text-center'>
                        Нет данных
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </>
        ) : (
          <div className='flex justify-center items-center h-32'>
            <span className='loading loading-infinity loading-xl'></span>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
