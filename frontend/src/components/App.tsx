import { useEffect, useState } from 'react';

function App() {
  const [hash, setHash] = useState('');
  const [stelSsid, setStelSsid] = useState('');
  const [stelToken, setStelToken] = useState('');
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

  useEffect(() => {
    const storedHash = localStorage.getItem('telegram_hash');
    const storedStelSsid = localStorage.getItem('stel_ssid');
    const storedStelToken = localStorage.getItem('stel_token');
    const storedChannels = localStorage.getItem('channels');
    const storedAdProductDesc = localStorage.getItem('ad_product_desc');

    if (storedHash) setHash(storedHash);
    if (storedStelSsid) setStelSsid(storedStelSsid);
    if (storedStelToken) setStelToken(storedStelToken);
    if (storedChannels) setChannels(storedChannels);
    if (storedAdProductDesc) setAdProductDesc(storedAdProductDesc);

    fetchCategories();
    fetchGeos();
    fetchChannelsByFilter();
  }, []);

  useEffect(() => {
    localStorage.setItem('telegram_hash', hash);
    localStorage.setItem('stel_ssid', stelSsid);
    localStorage.setItem('stel_token', stelToken);
    localStorage.setItem('channels', channels);
    localStorage.setItem('ad_product_desc', adProductDesc);
  }, [hash, stelSsid, stelToken, channels, adProductDesc]);

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
    const response = await fetch('http://127.0.0.1:8080/api/v1/categories/');
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
    const response = await fetch('http://127.0.0.1:8080/api/v1/geos/');
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
    if (!hash || !stelSsid || !stelToken || !channels) {
      setError('Пожалуйста, заполните все поля');
      return;
    }

    setError('');
    setChannelsList([]);

    const url = `http://127.0.0.1:8080/api/v1/channels/similar`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        hash: hash,
        stel_ssid: stelSsid,
        stel_token: stelToken,
        channels_names: channels.split(',').map((c) => c.trim()),
      }),
    });

    if (!response.ok) {
      setError(`Ошибка: ${response.status} ${response.statusText}`);
      return;
    }

    const data = await response.json();
    setChannelsList(data);
  };

  const fetchChannelsByFilter = async () => {
    setError('');
    setChannelsList([]);

    const params = new URLSearchParams();

    if (filterCategory) {
      params.append('category', filterCategory);
    }

    if (filterGeo) {
      params.append('geo', filterGeo);
    }
    const url = `http://127.0.0.1:8080/api/v1/channels/?${params.toString()}`;

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
  };

  const fetchChannelData = async (id: number) => {
    const url = `http://127.0.0.1:8080/api/v1/channels/${id}/get-new-data`;

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
    return data;
  };

  const addChannelUsername = (username: string) => {
    setChannels((prev) => (prev ? `${prev}, ${username}` : username));
  };

  const updateChannelData = (id: number) => {
    try {
      const updatedChannel = fetchChannelData(id);

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
      `http://127.0.0.1:8080/api/v1/channels/${channelId}/category`,
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
      `http://127.0.0.1:8080/api/v1/channels/${channelId}/geo`,
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
    const response = await fetch('http://127.0.0.1:8080/api/v1/ads/generate', {
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
        <input
          type='text'
          placeholder='Ваш Telegram Ads Hash'
          className='input input-bordered w-full'
          value={hash}
          onChange={(e) => setHash(e.target.value)}
        />
        <input
          type='text'
          placeholder='Ваш Stel SSID'
          className='input input-bordered w-full'
          value={stelSsid}
          onChange={(e) => setStelSsid(e.target.value)}
        />
        <input
          type='text'
          placeholder='Ваш Stel Token'
          className='input input-bordered w-full'
          value={stelToken}
          onChange={(e) => setStelToken(e.target.value)}
        />
        <textarea
          className='textarea w-full'
          placeholder='Ваш базовый канал'
          value={channels}
          onChange={(e) => setChannels(e.target.value)}
        />

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
          readOnly
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

        <div>
          <button className='btn btn-sm btn-error' onClick={clearChannels}>
            Очистить
          </button>
          <button className='btn btn-sm btn-info' onClick={addAllUsernames}>
            Добавить все
          </button>
        </div>

        <div className='overflow-x-auto mt-6'>
          <table className='table w-full'>
            <thead>
              <tr>
                <th>ID</th>
                <th>Фото</th>
                <th>Название</th>
                <th>Категория</th>
                <th>Гео</th>
                <th>Аудитория</th>
                <th>Действие</th>
              </tr>
            </thead>
            <tbody>
              {channelsList.length > 0 ? (
                channelsList.map((channel, index) => (
                  <tr key={index} className='hover:bg-gray-800'>
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
                          dangerouslySetInnerHTML={{ __html: channel.title }}
                        />
                      </a>
                    </td>
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
                        onChange={(e) => updateGeo(channel.id, e.target.value)}
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
      </div>
    </div>
  );
}

export default App;
