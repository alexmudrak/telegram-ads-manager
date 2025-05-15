import * as api from '../api/api';
import { loadFromStorage, saveToStorage } from '../utils/storage';
import { useCallback, useEffect, useState } from 'react';

interface CreateAdFormProps {
  channels: string;
  adText: string;
  setError: React.Dispatch<React.SetStateAction<string>>;
}

export const CreateAdForm: React.FC<CreateAdFormProps> = ({
  channels,
  adText,
  setError,
}) => {
  const [promoteUrl, setPromoteUrl] = useState<string>(() =>
    loadFromStorage('promoteUrl', ''),
  );
  const [cpm, setCpm] = useState(() => loadFromStorage('cpm', 0.1));
  const [viewsPerUser, setViewsPerUser] = useState(() =>
    loadFromStorage('viewsPerUser', 0),
  );
  const [budget, setBudget] = useState(() => loadFromStorage('budget', 0.1));
  const [dailyBudget, setDailyBudget] = useState(() =>
    loadFromStorage('dailyBudget', 0.1),
  );
  const [active, setActive] = useState(() => loadFromStorage('active', false));
  const [targetType, setTargetType] = useState<'channel' | 'search' | 'bot'>(
    () => loadFromStorage('targetType', 'channel'),
  );
  const [method, setMethod] = useState<'draft' | 'save'>(() =>
    loadFromStorage('method', 'draft'),
  );

  const sendAd = useCallback(async () => {
    setError('');
    try {
      console.log(adText);
      await api.createAd({
        text: adText,
        promote_url: promoteUrl,
        cpm: cpm,
        views_per_user: viewsPerUser,
        budget: budget,
        daily_budget: dailyBudget,
        active: active,
        target_type: targetType,
        channels: channels.split(',').map((c) => c.trim()),
        method: method,
      });
    } catch (error) {
      console.error('Error creating Ad:', error);
      setError((error as Error).message);
    }
  }, [
    adText,
    promoteUrl,
    cpm,
    viewsPerUser,
    budget,
    dailyBudget,
    active,
    channels,
    targetType,
    method,
    setError,
  ]);

  useEffect(() => {
    saveToStorage('promoteUrl', promoteUrl);
    saveToStorage('cpm', cpm);
    saveToStorage('viewsPerUser', viewsPerUser);
    saveToStorage('budget', budget);
    saveToStorage('dailyBudget', dailyBudget);
    saveToStorage('active', active);
    saveToStorage('method', method);
    saveToStorage('targetType', targetType);
  }, [
    promoteUrl,
    cpm,
    viewsPerUser,
    budget,
    dailyBudget,
    active,
    method,
    targetType,
  ]);

  return (
    <div className='space-y-4'>
      <h2 className='text-xl font-semibold'>3. Create Ad</h2>

      <fieldset className='fieldset bg-base-100 border-base-300 rounded-box w-64 border p-4'>
        <legend className='fieldset-legend'>Target Type</legend>
        <div className='join'>
          <input
            className={`join-item btn ${targetType === 'channel' ? 'btn-active' : ''}`}
            type='radio'
            name='targetType'
            aria-label='Channels'
            value='channel'
            checked={targetType === 'channel'}
            onChange={() => setTargetType('channel')}
          />
          <input
            className={`join-item btn ${targetType === 'bot' ? 'btn-active' : ''}`}
            type='radio'
            name='targetType'
            aria-label='Bots'
            value='bot'
            checked={targetType === 'bot'}
            onChange={() => setTargetType('bot')}
            disabled
          />
          <input
            className={`join-item btn ${targetType === 'bot' ? 'btn-active' : ''}`}
            type='radio'
            name='targetType'
            aria-label='Search'
            value='search'
            checked={targetType === 'search'}
            onChange={() => setTargetType('search')}
            disabled
          />
        </div>
      </fieldset>

      <label className='floating-label'>
        <span>Promote Url</span>
        <div className='flex w-full'>
          <span className='flex items-center px-3 bg-base-200 border border-r-0 rounded-l-md text-sm text-gray-600'>
            URL
          </span>
          <input
            type='text'
            placeholder='Promote URL'
            value={promoteUrl}
            onChange={(e) => setPromoteUrl(e.target.value)}
            className='input input-bordered w-full rounded-l-none'
          />
        </div>
      </label>

      <label className='floating-label'>
        <span>Cost per 1000 views</span>
        <div className='flex w-full'>
          <span className='flex items-center px-3 bg-base-200 border border-r-0 rounded-l-md text-sm text-gray-600'>
            TON
          </span>
          <input
            className='input input-bordered w-full'
            type='number'
            placeholder='CPM'
            step='0.01'
            value={cpm}
            onChange={(e) => setCpm(Number(e.target.value))}
          />
        </div>
      </label>

      <label className='floating-label'>
        <span>Total budget</span>
        <div className='flex w-full'>
          <span className='flex items-center px-3 bg-base-200 border border-r-0 rounded-l-md text-sm text-gray-600'>
            TON
          </span>
          <input
            className='input input-bordered w-full'
            type='number'
            placeholder='Total budget'
            step='0.01'
            value={budget}
            onChange={(e) => setBudget(Number(e.target.value))}
          />
        </div>
      </label>

      <label className='floating-label'>
        <span>Daily budget</span>
        <div className='flex w-full'>
          <span className='flex items-center px-3 bg-base-200 border border-r-0 rounded-l-md text-sm text-gray-600'>
            TON
          </span>
          <input
            className='input input-bordered w-full'
            type='number'
            placeholder='Daily budget'
            step='0.01'
            value={dailyBudget}
            onChange={(e) => setDailyBudget(Number(e.target.value))}
          />
        </div>
      </label>

      <label className='floating-label'>
        <span>Views per user</span>
        <div className='flex w-full'>
          <span className='flex items-center px-3 bg-base-200 border border-r-0 rounded-l-md text-sm text-gray-600'>
            VIEWS
          </span>
          <input
            className='input input-bordered w-full'
            type='number'
            placeholder='Views per user'
            value={viewsPerUser}
            onChange={(e) => setViewsPerUser(Number(e.target.value))}
          />
        </div>
      </label>

      <fieldset className='fieldset bg-base-100 border-base-300 rounded-box w-64 border p-4'>
        <legend className='fieldset-legend'>Active</legend>
        <label className='label'>
          <input
            type='checkbox'
            className='checkbox'
            checked={active}
            onChange={(e) => setActive(e.target.checked)}
          />
          Ad will active after moderation
        </label>
      </fieldset>

      <fieldset className='fieldset bg-base-100 border-base-300 rounded-box w-64 border p-4'>
        <legend className='fieldset-legend'>Save Method</legend>
        <div className='join'>
          <input
            className={`join-item btn ${method === 'draft' ? 'btn-active' : ''}`}
            type='radio'
            name='method'
            aria-label='Draft'
            value='draft'
            checked={method === 'draft'}
            onChange={() => setMethod('draft')}
          />
          <input
            className={`join-item btn ${method === 'save' ? 'btn-active' : ''}`}
            type='radio'
            name='method'
            aria-label='Save'
            value='save'
            checked={method === 'save'}
            onChange={() => setMethod('save')}
          />
        </div>
      </fieldset>

      <button className='btn btn-primary w-full' onClick={sendAd}>
        Create Ad
      </button>
    </div>
  );
};
