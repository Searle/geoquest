import { useState } from 'react';
import locales from '../locales/de.json';
import countriesData from '../data/countries.json';
import './AfricaMap.css';

interface CountryInfo {
  name: string;
  capital: string;
}

interface HoverInfo {
  country: CountryInfo;
  x: number;
  y: number;
}

const AfricaMap = () => {
  const [hoverInfo, setHoverInfo] = useState<HoverInfo | null>(null);

  const handleCountryHover = (
    countryCode: string,
    event: React.MouseEvent<SVGPathElement>
  ) => {
    const country = locales.countries[countryCode as keyof typeof locales.countries];
    if (country) {
      setHoverInfo({
        country,
        x: event.clientX,
        y: event.clientY,
      });
    }
  };

  const handleCountryLeave = () => {
    setHoverInfo(null);
  };

  // Filter for African countries
  const africanCountries = Object.entries(countriesData).filter(
    ([_, data]) => data.continent === 'africa'
  );

  return (
    <div className="africa-map-container">
      <svg
        viewBox="0 0 1000 1000"
        className="africa-map"
        xmlns="http://www.w3.org/2000/svg"
      >
        {africanCountries.map(([countryCode, countryData]) => (
          <path
            key={countryCode}
            d={countryData.path}
            className="country"
            data-country={countryCode}
            onMouseMove={(e) => handleCountryHover(countryCode, e)}
            onMouseLeave={handleCountryLeave}
          />
        ))}
      </svg>

      {hoverInfo && (
        <div
          className="country-tooltip"
          style={{
            left: `${hoverInfo.x + 10}px`,
            top: `${hoverInfo.y + 10}px`,
          }}
        >
          <div className="country-name">{hoverInfo.country.name}</div>
          <div className="country-capital">Hauptstadt: {hoverInfo.country.capital}</div>
        </div>
      )}
    </div>
  );
};

export default AfricaMap;
