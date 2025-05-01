import { useEffect, useState } from 'react';

function App() {
  const [hash, setHash] = useState('');
  const [stelSsid, setStelSsid] = useState('');
  const [stelToken, setStelToken] = useState('');
  const [channel, setChannel] = useState('');
  const [channels, setChannels] = useState<any[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [error, setError] = useState('');
  const [generatedLinks, setGeneratedLinks] = useState('');
  const [adProductDesc, setAdProductDesc] = useState('');
  const [generatedAdMessage, setGeneratedAdMessage] = useState('');

  useEffect(() => {
    const storedHash = localStorage.getItem('telegram_hash');
    const storedStelSsid = localStorage.getItem('stel_ssid');
    const storedStelToken = localStorage.getItem('stel_token');
    const storedChannel = localStorage.getItem('channel');
    const storedAdProductDesc = localStorage.getItem('ad_product_desc');

    if (storedHash) setHash(storedHash);
    if (storedStelSsid) setStelSsid(storedStelSsid);
    if (storedStelToken) setStelToken(storedStelToken);
    if (storedChannel) setChannel(storedChannel);
    if (storedAdProductDesc) setAdProductDesc(storedAdProductDesc);

    fetchCategories();
  }, []);

  useEffect(() => {
    localStorage.setItem('telegram_hash', hash);
    localStorage.setItem('stel_ssid', stelSsid);
    localStorage.setItem('stel_token', stelToken);
    localStorage.setItem('channel', channel);
    localStorage.setItem('ad_product_desc', adProductDesc);
  }, [hash, stelSsid, stelToken, channel, adProductDesc]);

  const fetchCategories = async () => {
    const response = await fetch('http://127.0.0.1:8080/api/categories');
    if (!response.ok) {
      console.error(
        `Ошибка при загрузке категорий: ${response.status} ${response.statusText}`,
      );
      return;
    }
    const data = await response.json();
    setCategories(data);
  };

  const fetchSimilarChannels = async () => {
    if (!hash || !stelSsid || !stelToken || !channel) {
      setError('Пожалуйста, заполните все поля');
      return;
    }

    setError('');
    setChannels([]);

    const url = `http://127.0.0.1:8080/api/similar-channels`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        hash: hash,
        stel_ssid: stelSsid,
        stel_token: stelToken,
        channels: channel,
      }),
    });

    if (!response.ok) {
      setError(`Ошибка: ${response.status} ${response.statusText}`);
      return;
    }

    const data = await response.json();
    setChannels(data);
  };

  const fetchChannelsByCategory = async (category: string) => {
    setError('');
    setChannels([]);

    const url = `http://127.0.0.1:8080/api/get-by-category`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        category: category,
      }),
    });

    if (!response.ok) {
      setError(`Ошибка: ${response.status} ${response.statusText}`);
      return;
    }

    const data = await response.json();
    setChannels(data);
  };

  const addChannelUsername = (username: string) => {
    setChannel((prev) => (prev ? `${prev}, ${username}` : username));
  };

  const updateCategory = async (channelId: string, newCategory: string) => {
    const response = await fetch(
      `http://127.0.0.1:8080/api/channels/${channelId}/category`,
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

  const generateAdMessage = async () => {
    const response = await fetch('http://127.0.0.1:8080/api/generate-ad', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        channels: channel,
        product_description: adProductDesc,
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
    const selectedChannelUsernames = channel
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
        <input
          type='text'
          placeholder='Ваш базовый канал'
          className='input input-bordered w-full'
          value={channel}
          onChange={(e) => setChannel(e.target.value)}
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
          className='textarea w-full'
          placeholder='Описание рекламируемого продукта'
          value={adProductDesc}
          onChange={(e) => setAdProductDesc(e.target.value)}
        />

        <textarea
          className='textarea w-full'
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
          {categories.length > 0 ? (
            categories.map((category, index) => (
              <button
                key={index}
                className='btn mx-2 mb-2'
                onClick={() => {
                  fetchChannelsByCategory(category);
                }}
              >
                {`${category.toUpperCase()}`}
              </button>
            ))
          ) : (
            <span>No categories</span>
          )}
        </div>

        <div className='overflow-x-auto mt-6'>
          <table className='table w-full table-zebra'>
            <thead>
              <tr>
                <th>ID</th>
                <th>Фото</th>
                <th>Название</th>
                <th>Категория</th>
                <th>Аудитория</th>
                <th>Действие</th>
              </tr>
            </thead>
            <tbody>
              {channels.length > 0 ? (
                channels.map((channel, index) => (
                  <tr key={index}>
                    <th>{channel.id}</th>
                    <td>
                      <div
                        className='mask mask-squircle'
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
                    <td>{channel.subscribers}</td>
                    <td>
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
