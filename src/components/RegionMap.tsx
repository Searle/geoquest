import { useState, useEffect } from 'react';
import { geoPath, geoNaturalEarth1 } from 'd3-geo';
import clsx from 'clsx';

import type { Feature, FeatureCollection, GeoJsonProperties, Geometry } from 'geojson';
import { getCountriesByRegion, type CountryData } from '../utils/countryData.js';
import type { Region } from '../types/countries-json.js';

import './RegionMap.css';

interface CountryGeoData {
    country: CountryData;
    feature: FeatureCollection | Feature<Geometry, GeoJsonProperties>;
}

interface RegionMapProps {
    region: Region;
    onCountryClick?: (country: CountryData, event: React.MouseEvent<SVGPathElement>) => void;
    onCountryHover?: (country: CountryData, event: React.MouseEvent<SVGPathElement>) => void;
    onCountryLeave?: () => void;
    getCountryHighlight?: (country: CountryData) => 'correct' | 'incorrect' | 'hovered' | null;
    onCountriesLoaded?: (countries: CountryData[]) => void;
    isAnsweredCorrectly?: (country: CountryData) => boolean;
}

/**
 * Pure presentational component for rendering an interactive region map
 * No game logic - just renders countries and calls callbacks
 */
const RegionMap = ({
    region,
    onCountryClick,
    onCountryHover,
    onCountryLeave,
    getCountryHighlight,
    onCountriesLoaded,
    isAnsweredCorrectly,
}: RegionMapProps) => {
    const [countries, setCountries] = useState<CountryGeoData[]>([]);
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

            // Notify parent of loaded countries
            if (onCountriesLoaded) {
                onCountriesLoaded(loadedCountries.map((c) => c.country));
            }
        };

        loadCountryData();
    }, [region, onCountriesLoaded]);

    // Set up projection to fill the entire viewBox
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
        return <div className='loading'>Loading map data...</div>;
    }

    return (
        <svg viewBox={`${x0} ${y0} ${width} ${height}`} className='region-map' xmlns='http://www.w3.org/2000/svg'>
            {countries
                .sort((a, b) => {
                    // Draw answered countries first (behind unanswered ones)
                    if (isAnsweredCorrectly) {
                        const aAnswered = isAnsweredCorrectly(a.country);
                        const bAnswered = isAnsweredCorrectly(b.country);
                        if (aAnswered && !bAnswered) return -1;
                        if (!aAnswered && bAnswered) return 1;
                    }
                    // Within same category, largest first
                    return b.country.area - a.country.area;
                })
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
                        const hitAreaSize = country.area < 30000 ? 12 : country.area < 100000 ? 8 : 4;

                        // Get highlight state from parent
                        const highlightState = getCountryHighlight?.(country);

                        return (
                            <g key={`${country.cca3}-${index}`}>
                                {/* Invisible hit area with thick stroke for edges and fill for interior */}
                                <path
                                    d={pathData}
                                    fill='transparent'
                                    stroke='transparent'
                                    strokeWidth={hitAreaSize}
                                    vectorEffect='non-scaling-stroke'
                                    onMouseMove={(e) => onCountryHover?.(country, e)}
                                    onMouseLeave={() => onCountryLeave?.()}
                                    onClick={(e) => onCountryClick?.(country, e)}
                                />
                                {/* Visible path */}
                                <path
                                    d={pathData}
                                    className={clsx('country', {
                                        hovered: highlightState === 'hovered',
                                        'quiz-target': highlightState === 'correct',
                                        'quiz-incorrect': highlightState === 'incorrect',
                                    })}
                                    data-country={country.cca3}
                                    vectorEffect='non-scaling-stroke'
                                    style={{ pointerEvents: 'none' }}
                                />
                            </g>
                        );
                    });
                })}
        </svg>
    );
};

export default RegionMap;
