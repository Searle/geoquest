import { useState, useEffect } from 'react';
import { geoPath, geoMercator, geoNaturalEarth1, geoConicEqualArea, geoAlbers, geoEquirectangular } from 'd3-geo';
import clsx from 'clsx';

import type { Feature, FeatureCollection, GeoJsonProperties, Geometry } from 'geojson';
import { getCountriesByRegion, getCountryName, getCapital, type CountryData } from '../utils/countryData.js';
import type { Region } from '../types/countries-json.js';

import './RegionMap.css';

interface CountryGeoData {
    country: CountryData;
    feature: FeatureCollection | Feature<Geometry, GeoJsonProperties>;
}

interface HoverInfo {
    country: CountryData;
    x: number;
    y: number;
}

const RegionMap = ({ region }: { region: Region }) => {
    const [countries, setCountries] = useState<CountryGeoData[]>([]);
    const [hoverInfo, setHoverInfo] = useState<HoverInfo | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadCountryData = async () => {
            const regionCountries = getCountriesByRegion(region);

            // Load GeoJSON for each country
            const countryDataPromises = regionCountries.map(async (country) => {
                try {
                    const response = await fetch(`/data/countries/data/${country.cca3.toLowerCase()}.geo.json`);
                    if (!response.ok) {
                        console.warn(`Failed to load GeoJSON for ${country.name.common}`);
                        return null;
                    }
                    const feature = await response.json();
                    return { country, feature };
                } catch (error) {
                    console.warn(`Error loading ${country.name.common}:`, error);
                    return null;
                }
            });

            const loadedCountries = (await Promise.all(countryDataPromises)).filter(
                (c): c is CountryGeoData => c !== null,
            );

            setCountries(loadedCountries);
            setLoading(false);
        };

        loadCountryData();
    }, [region]);

    const handleCountryHover = (country: CountryData, event: React.MouseEvent<SVGPathElement>) => {
        setHoverInfo({
            country,
            x: event.clientX,
            y: event.clientY,
        });
    };

    const handleCountryLeave = () => {
        setHoverInfo(null);
    };

    // Set up projection for Africa to fill the entire viewBox
    // Create a FeatureCollection of all countries for bounds calculation
    const allFeatures: Feature[] = countries.flatMap(({ feature }) =>
        feature.type === 'FeatureCollection' ? feature.features : [feature],
    );

    const featureCollection: FeatureCollection = {
        type: 'FeatureCollection',
        features: allFeatures,
    };

    const projection = geoNaturalEarth1()
        .fitSize([1000, 1000], featureCollection)
        .preclip((stream) => stream); // Disable antimeridian clipping

    const pathGenerator = geoPath().projection(projection);

    // Calculate actual bounds of the projected features
    const bounds = pathGenerator.bounds(featureCollection);
    const [[x0, y0], [x1, y1]] = bounds;
    const width = x1 - x0;
    const height = y1 - y0;

    if (loading) {
        return (
            <div className='region-map-container'>
                <div className='loading'>Loading map data...</div>
            </div>
        );
    }

    return (
        <div className='region-map-container'>
            <svg viewBox={`${x0} ${y0} ${width} ${height}`} className='region-map' xmlns='http://www.w3.org/2000/svg'>
                {countries
                    .sort((a, b) => b.country.area - a.country.area) // Largest first, smallest on top
                    .map(({ country, feature }) => {
                        // Handle both single features and feature collections
                        const features = feature.type === 'FeatureCollection' ? feature.features : [feature];

                        return features.map((f: Feature<Geometry>, index: number) => {
                            // For MultiPolygon, filter out small outlier polygons
                            let filteredFeature = f;
                            if (f.geometry?.type === 'MultiPolygon') {
                                const coords = f.geometry.coordinates;
                                // Only keep polygons with more than 100 points (main landmass)
                                const filtered = coords.filter((polygon) => polygon[0].length > 100);
                                if (filtered.length > 0) {
                                    filteredFeature = {
                                        ...f,
                                        geometry: {
                                            ...f.geometry,
                                            coordinates: filtered,
                                        },
                                    };
                                }
                            }

                            const pathData = pathGenerator(filteredFeature);
                            if (!pathData) return null;

                            // Dynamic hit area size based on country area
                            // Smaller countries get larger hit areas for better UX
                            const hitAreaSize = country.area < 30000 ? 20 : country.area < 100000 ? 15 : 10;

                            const hovered = hoverInfo?.country === country;

                            return (
                                <g key={`${country.cca3}-${index}`}>
                                    {/* Invisible hit area with thick stroke for edges and fill for interior */}
                                    <path
                                        d={pathData}
                                        fill='transparent'
                                        stroke='transparent'
                                        strokeWidth={hitAreaSize}
                                        vectorEffect='non-scaling-stroke'
                                        onMouseMove={(e) => handleCountryHover(country, e)}
                                        onMouseLeave={handleCountryLeave}
                                    />
                                    {/* Visible path */}
                                    <path
                                        d={pathData}
                                        className={clsx('country', { hovered })}
                                        data-country={country.cca3}
                                        vectorEffect='non-scaling-stroke'
                                        style={{ pointerEvents: 'none' }}
                                    />
                                </g>
                            );
                        });
                    })}
            </svg>

            {hoverInfo && (
                <div
                    className='country-tooltip'
                    style={{
                        left: `${hoverInfo.x + 10}px`,
                        top: `${hoverInfo.y + 10}px`,
                    }}
                >
                    <div className='country-name'>{getCountryName(hoverInfo.country, 'deu')}</div>
                    <div className='country-capital'>Hauptstadt: {getCapital(hoverInfo.country)}</div>
                </div>
            )}
        </div>
    );
};

export default RegionMap;
