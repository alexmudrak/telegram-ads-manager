import React from 'react';

interface FilterButtonsProps {
  categories: string[];
  geos: string[];
  filterCategory: string | null;
  filterGeo: string | null;
  onCategoryClick: (category: string) => void;
  onGeoClick: (geo: string) => void;
}

export const FilterButtons: React.FC<FilterButtonsProps> = ({
  categories,
  geos,
  filterCategory,
  filterGeo,
  onCategoryClick,
  onGeoClick,
}) => {
  return (
    <>
      <div className='flex flex-wrap justify-center my-4'>
        {geos.length > 0 ? (
          geos.map((geo, index) => (
            <button
              key={index}
              className={`btn mx-2 mb-2 ${filterGeo === geo ? 'btn-warning' : ''}`}
              onClick={() => onGeoClick(geo)}
            >
              {geo.toUpperCase()}
            </button>
          ))
        ) : (
          <span>No geos</span>
        )}
      </div>

      <div className='flex flex-wrap justify-center my-4'>
        {categories.length > 0 ? (
          categories.map((category, index) => (
            <button
              key={index}
              className={`btn mx-2 mb-2 ${filterCategory === category ? 'btn-warning' : ''}`}
              onClick={() => onCategoryClick(category)}
            >
              {category.toUpperCase()}
            </button>
          ))
        ) : (
          <span>No categories</span>
        )}
      </div>
    </>
  );
};
