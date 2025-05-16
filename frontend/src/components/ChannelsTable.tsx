import { Channel } from '../types/types';
import { RefreshCw, Search, UserPlus, Users } from 'lucide-react';
import React, { useMemo, useRef, useState } from 'react';
import { FixedSizeList as List } from 'react-window';

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
    const [searchTerm, setSearchTerm] = useState('');
    const [sortField, setSortField] = useState<string>('');
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
    const listRef = useRef<List>(null);
    const outerRef = useRef<HTMLDivElement>(null);

    const filteredChannels = useMemo(() => {
        let filtered = [...channelsList];

        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            filtered = filtered.filter(
                (channel) =>
                    channel.title.toLowerCase().includes(term) ||
                    channel.username.toLowerCase().includes(term) ||
                    (channel.description &&
                        channel.description.toLowerCase().includes(term)),
            );
        }

        if (sortField) {
            filtered.sort((a, b) => {
                let valueA = a[sortField as keyof Channel];
                let valueB = b[sortField as keyof Channel];

                if (valueA === null || valueA === undefined) valueA = '';
                if (valueB === null || valueB === undefined) valueB = '';

                if (sortField === 'subscribers') {
                    valueA = Number(valueA) || 0;
                    valueB = Number(valueB) || 0;
                }

                if (typeof valueA === 'string' && typeof valueB === 'string') {
                    return sortDirection === 'asc'
                        ? valueA.localeCompare(valueB)
                        : valueB.localeCompare(valueA);
                } else {
                    return sortDirection === 'asc'
                        ? valueA < valueB
                            ? -1
                            : valueA > valueB
                                ? 1
                                : 0
                        : valueB < valueA
                            ? -1
                            : valueB > valueA
                                ? 1
                                : 0;
                }
            });
        }

        return filtered;
    }, [channelsList, searchTerm, sortField, sortDirection]);

    const handleSort = (field: string) => {
        if (sortField === field) {
            setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
        } else {
            setSortField(field);
            setSortDirection('asc');
        }
    };

    const getSortIndicator = (field: string) => {
        if (sortField !== field) return null;
        return sortDirection === 'asc' ? ' ↑' : ' ↓';
    };

    const Row = ({
        index,
        style,
    }: {
        index: number;
        style: React.CSSProperties;
    }) => {
        const channel = filteredChannels[index];

        return (
            <div
                style={style}
                className='flex items-center border-b border-gray-700 hover:bg-gray-800 transition-colors py-2 px-4'
            >
                <div className='w-10 flex-shrink-0 text-gray-400'>{index + 1}</div>

                <div className='w-30 flex-shrink-0 text-gray-400'>{channel.id}</div>

                <div className='w-12 flex-shrink-0'>
                    <div
                        className='mask mask-squircle w-10 h-10 bg-gray-700 overflow-hidden flex items-center justify-center'
                        data-tip={channel.description}
                        dangerouslySetInnerHTML={{ __html: channel.photo_element }}
                    />
                </div>

                <div
                    className='w-70 flex-shrink-0 px-2 tooltip tooltip-right'
                    data-tip={channel.description}
                >
                    <a
                        href={`https://t.me/s/${channel.username}`}
                        target='_blank'
                        rel='noopener noreferrer'
                        className='text-blue-400 hover:text-blue-300 hover:underline font-medium'
                    >
                        <span dangerouslySetInnerHTML={{ __html: channel.title }} />
                    </a>
                </div>

                <div className='w-45 flex-shrink-0 text-gray-300'>
                    {channel.username}
                </div>

                <div className='w-40 flex-shrink-0'>
                    <select
                        value={channel.category || ''}
                        className='select select-bordered select-sm bg-base-300 border-gray-700 w-full focus:border-blue-500'
                        onChange={(e) => updateChannelCategory(channel.id, e.target.value)}
                    >
                        <option value='' disabled>
                            Choose category
                        </option>
                        {categories.map((category, idx) => (
                            <option key={idx} value={category}>
                                {category}
                            </option>
                        ))}
                    </select>
                </div>

                <div className='w-36 flex-shrink-0'>
                    <select
                        value={channel.geo || ''}
                        className='select select-bordered select-sm bg-base-300 border-gray-700 w-full focus:border-blue-500'
                        onChange={(e) => updateChannelGeo(channel.id, e.target.value)}
                    >
                        <option value='' disabled>
                            Choose geo
                        </option>
                        {geos.map((geo, idx) => (
                            <option key={idx} value={geo}>
                                {geo}
                            </option>
                        ))}
                    </select>
                </div>

                <div className='w-24 flex-shrink-0 text-right font-medium'>
                    {new Intl.NumberFormat().format(channel.subscribers || 0)}
                </div>

                <div className='w-36 flex-shrink-0 flex gap-2 justify-end'>
                    <button
                        className='btn btn-xs btn-warning'
                        onClick={() => updateChannelData(channel.id)}
                        title='Refresh channel data'
                    >
                        <RefreshCw size={14} />
                    </button>
                    <button
                        className='btn btn-xs btn-secondary'
                        onClick={() => addChannelUsername(channel.username)}
                        title='Add this channel'
                    >
                        <UserPlus size={14} />
                    </button>
                </div>
            </div>
        );
    };

    const TableHeader = () => (
        <div className='flex items-center border-b-2 border-gray-600 py-2 px-4 bg-base-300 sticky top-0 z-10 overflow-x-auto'>
            <div
                className='w-10 flex-shrink-0 font-medium text-gray-200 cursor-pointer'
                onClick={() => handleSort('id')}
            >
                # {getSortIndicator('id')}
            </div>
            <div
                className='w-30 flex-shrink-0 font-medium text-gray-200 cursor-pointer'
                onClick={() => handleSort('id')}
            >
                ID {getSortIndicator('id')}
            </div>
            <div className='w-12 flex-shrink-0 font-medium text-gray-200'>Image</div>
            <div
                className='w-70 flex-shrink-0 font-medium text-gray-200 cursor-pointer px-2'
                onClick={() => handleSort('title')}
            >
                Title {getSortIndicator('title')}
            </div>
            <div
                className='w-45 flex-shrink-0 font-medium text-gray-200 cursor-pointer'
                onClick={() => handleSort('username')}
            >
                Username {getSortIndicator('username')}
            </div>
            <div
                className='w-40 flex-shrink-0 font-medium text-gray-200 cursor-pointer'
                onClick={() => handleSort('category')}
            >
                Category {getSortIndicator('category')}
            </div>
            <div
                className='w-36 flex-shrink-0 font-medium text-gray-200 cursor-pointer'
                onClick={() => handleSort('geo')}
            >
                Geo {getSortIndicator('geo')}
            </div>
            <div
                className='w-24 flex-shrink-0 font-medium text-gray-200 cursor-pointer text-right'
                onClick={() => handleSort('subscribers')}
            >
                Subs {getSortIndicator('subscribers')}
            </div>
            <div className='w-36 flex-shrink-0 font-medium text-gray-200 text-right'>
                Actions
            </div>
        </div>
    );

    return (
        <div className='bg-base-200 rounded-lg shadow-lg py-4'>
            <div className='flex justify-between items-center mb-4'>
                <div className='relative w-64'>
                    <input
                        type='text'
                        placeholder='Search channels...'
                        className='input input-bordered pl-10 w-full bg-gray-800 border-gray-700 focus:bg-gray-900/10'
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    <div className='absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none'>
                        <Search size={16} className='text-gray-400' />
                    </div>
                </div>

                <button
                    className='btn btn-info flex items-center gap-2'
                    onClick={addAllUsernames}
                >
                    <Users size={16} />
                    Add all channels
                </button>
            </div>

            <div className='border border-gray-700 rounded-lg overflow-hidden'>
                <TableHeader />

                <div style={{ height: '500px' }}>
                    <List
                        ref={listRef}
                        outerRef={outerRef}
                        height={500}
                        itemSize={100}
                        width='100%'
                        itemCount={filteredChannels.length}
                        itemData={filteredChannels}
                    >
                        {Row}
                    </List>
                </div>
            </div>

            <div className='mt-4 text-gray-400 text-sm'>
                Showing {filteredChannels.length} of {channelsList.length} channels
            </div>
        </div>
    );
};
