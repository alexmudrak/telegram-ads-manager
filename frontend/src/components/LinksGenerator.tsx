import React from 'react';

interface LinksGeneratorProps {
  generatedLinks: string;
  setGeneratedLinks: (links: string) => void;
  generateLinks: () => void;
}

export const LinksGenerator: React.FC<LinksGeneratorProps> = ({
  generatedLinks,
  setGeneratedLinks,
  generateLinks,
}) => {
  return (
    <div className='my-4'>
      <textarea
        className='textarea w-full'
        placeholder='Generated links'
        value={generatedLinks}
        onChange={(e) => setGeneratedLinks(e.target.value)}
      />
      <button className='btn btn-outline w-full my-2' onClick={generateLinks}>
        Generate Links
      </button>
    </div>
  );
};
