import { useEffect, useState } from 'react';

function App() {
  const [hash, setHash] = useState('');
  const [stelSsid, setStelSsid] = useState('');
  const [stelToken, setStelToken] = useState('');
  const [channel, setChannel] = useState('');
  const [channels, setChannels] = useState<any[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    const storedHash = localStorage.getItem('telegram_hash');
    const storedStelSsid = localStorage.getItem('stel_ssid');
    const storedStelToken = localStorage.getItem('stel_token');
    const storedChannel = localStorage.getItem('channel');

    if (storedHash) setHash(storedHash);
    if (storedStelSsid) setStelSsid(storedStelSsid);
    if (storedStelToken) setStelToken(storedStelToken);
    if (storedChannel) setChannel(storedChannel);
  }, []);

  useEffect(() => {
    localStorage.setItem('telegram_hash', hash);
    localStorage.setItem('stel_ssid', stelSsid);
    localStorage.setItem('stel_token', stelToken);
    localStorage.setItem('channel', channel);
  }, [hash, stelSsid, stelToken, channel]);

  const fetchSimilarChannels = async () => {
    if (!hash || !stelSsid || !stelToken || !channel) {
      setError('Пожалуйста, заполните все поля');
      return;
    }

    setError('');

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
        <button
          className='btn btn-primary w-full'
          onClick={fetchSimilarChannels}
        >
          Получить каналы
        </button>

        {error && <p className='text-red-500'>{error}</p>}
      </div>

      <div className='overflow-x-auto mt-6'>
        <table className='table w-full table-zebra'>
          <thead>
            <tr>
              <th>Фото</th>
              <th>ID</th>
              <th>Название</th>
              <th>Ссылка</th>
              <th>Категория</th>
              <th>Аудитория</th>
            </tr>
          </thead>
          <tbody>
            {channels.length > 0 ? (
              channels.map((channel, index) => (
                <tr key={index}>
                  <td
                    dangerouslySetInnerHTML={{ __html: channel.photo_element }}
                  />
                  <th>{channel.id}</th>
                  <td dangerouslySetInnerHTML={{ __html: channel.name }} />
                  <td>{channel.link}</td>
                  <td>{channel.category}</td>
                  <td>{channel.subscribers}</td>
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
  );
}

export default App;
