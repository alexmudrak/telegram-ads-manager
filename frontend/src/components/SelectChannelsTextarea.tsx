import { useEffect, useState } from 'react';

interface SelectChannelsTextareaProps {
  channels: string[];
  setChannels: (channel: string[]) => void;
}
export const SelectChannelsTextarea: React.FC<SelectChannelsTextareaProps> = ({
  channels,
  setChannels,
}) => {
  const [channelInput, setChannelInput] = useState<string>(channels.join(','));

  useEffect(() => {
    setChannelInput(channels.join(','));
  }, [channels]);
  return (
    <label className='floating-label'>
      <span>Channels to Ad</span>
      <textarea
        className='textarea w-full'
        placeholder='Channels to Ad (comma-separated)'
        value={channelInput}
        onChange={(e) => {
          const input = e.target.value;
          setChannelInput(input);

          const parsed = input
            .split(',')
            .map((line) => line.trim())
            .filter(Boolean);
          setChannels(parsed);
        }}
      />
    </label>
  );
};
