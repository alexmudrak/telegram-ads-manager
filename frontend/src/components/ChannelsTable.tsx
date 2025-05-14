import { Channel } from '../types/types';
import React from 'react';

interface ChannelsTableProps {
  channelsList: Channel[];
  categories: string[];
  geos: string[];
  updateChannelCategory: (channelId: number, category: string) => void;
  updateChannelGeo: (channelId: number, geo: string) => void;
  updateChannelData: (channelId: number) => Promise<void>;
  addChannelUsername: (username: string) => void;
  addAllUsernames: () => void;
}

export const ChannelsTable: React.FC<ChannelsTableProps> = ({
  channelsList,
  categories,
  geos,
  updateChannelCategory,
  updateChannelGeo,
  updateChannelData,
  addChannelUsername,
  addAllUsernames,
}) => {
  return (
    <>
      <div>
        <button className='btn btn-sm btn-info' onClick={addAllUsernames}>
          Add all
        </button>
      </div>

      <div className='overflow-x-auto mt-6'>
        <table className='table w-full'>
          <thead>
            <tr>
              <th>#</th>
              <th>ID</th>
              <th>Image</th>
              <th>Title</th>
              <th>Username</th>
              <th>Category</th>
              <th>Geo</th>
              <th>Subscribers</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {channelsList.length > 0 ? (
              channelsList.map((channel, index) => (
                <tr key={channel.id} className='hover:bg-gray-800'>
                  <td>{index + 1}</td>
                  <td>{channel.id}</td>
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
                  <td>{channel.username}</td>
                  <td>
                    <select
                      defaultValue={channel.category || ''}
                      className='select select-ghost'
                      onChange={(e) =>
                        updateChannelCategory(channel.id, e.target.value)
                      }
                    >
                      <option value='' disabled>
                        Choose category
                      </option>
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
                        updateChannelGeo(channel.id, e.target.value)
                      }
                    >
                      <option value='' disabled>
                        Choose geo
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
                      Refresh
                    </button>

                    <button
                      className='btn btn-sm btn-secondary'
                      onClick={() => addChannelUsername(channel.username)}
                    >
                      Add
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={9} className='text-center'>
                  No data
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  );
};
