import { useState, useEffect, useMemo } from 'react';
import { geoPath, geoMercator, geoBounds, type GeoStream } from 'd3-geo';

import type { Feature, FeatureCollection, GeoJsonProperties, Geometry } from 'geojson';
import { getCountriesByRegion, type CountryData } from '../utils/countryData.js';
import type { Region } from '../types/countries-json.js';
import { Country } from './Country.js';

import './RegionMap.css';

function preclipEurope(stream: GeoStream): GeoStream {
    return {
        point(x, y, z) {
            if (x <= -0.3) {
                stream.point(x, y, z);
            }
        },
        lineStart() {
            stream.lineStart();
        },
        lineEnd() {
            stream.lineEnd();
        },
        polygonStart() {
            stream.polygonStart();
        },
        polygonEnd() {
            stream.polygonEnd();
        },
        sphere() {
            stream.sphere?.();
        },
    };
}

interface CountryGeoData {
    country: CountryData;
    feature: FeatureCollection | Feature<Geometry, GeoJsonProperties>;
}

interface RegionMapProps {
    region: Region;
    onCountryClick: (country: CountryData, event: React.MouseEvent<SVGPathElement>) => void;
    onCountryHover: (country: CountryData, event: React.MouseEvent<SVGPathElement>) => void;
    onCountryLeave: () => void;
    getCountryHighlight: (country: CountryData) => 'correct' | 'incorrect' | 'hovered' | null;
    onCountriesLoaded: (countries: CountryData[]) => void;
    isAnsweredCorrectly: (country: CountryData) => boolean;
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
                    const response = await fetch(`data/countries/data/${country.cca3.toLowerCase()}.geo.json`);
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

    // Memoize projection setup - only recalculate when countries change
    const { pathGenerator, viewBox } = useMemo(() => {
        // Create a FeatureCollection of all countries for bounds calculation
        const allFeatures: Feature[] = countries.flatMap(({ feature }) =>
            feature.type === 'FeatureCollection' ? feature.features : [feature],
        );

        const featureCollection: FeatureCollection = {
            type: 'FeatureCollection',
            features: allFeatures,
        };

        // By default, disable antimeridian clipping, as it somehow destroys the output
        let preclip: (stream: GeoStream) => GeoStream = (stream) => stream;

        // Calculate rotation to center the region and avoid antimeridian splits
        const rotation = [0, 0] as [number, number];
        if (region === 'Americas') {
            rotation[0] = 90;
        }
        if (region === 'Europe') {
            rotation[0] = -90;
            preclip = preclipEurope;
        }
        if (region === 'Oceania') {
            rotation[0] = -90;
        }
        if (region === 'Antarctic') {
            rotation[1] = 100;
        }
        const projection = geoMercator() // Project
            .rotate(rotation)
            .fitSize([1000, 1000], featureCollection)
            .preclip(preclip);
        const pathGen = geoPath().projection(projection);

        // Calculate actual bounds of the projected features
        const bounds = pathGen.bounds(featureCollection);
        const [[x0, y0], [x1, y1]] = bounds;
        const width = x1 - x0;
        const height = y1 - y0;

        return {
            pathGenerator: pathGen,
            viewBox: { x0, y0, width, height },
        };
    }, [countries]);

    // Split countries into answered and unanswered groups
    const answeredCountries = countries.filter(({ country }) => isAnsweredCorrectly(country));
    const unansweredCountries = countries.filter(({ country }) => !isAnsweredCorrectly(country));

    if (loading) {
        return <div className='loading'>Loading map data...</div>;
    }

    // Sort function for countries - simple sort by area
    const sortCountries = (a: CountryGeoData, b: CountryGeoData) => {
        // Largest countries first (drawn behind)
        return b.country.area - a.country.area;
    };

    // Get highlight state for main SVG (only 'correct', hovered/incorrect in overlay)
    const getMainHighlight = (country: CountryData): 'correct' | null => {
        const highlight = getCountryHighlight(country);
        return highlight === 'correct' ? 'correct' : null;
    };

    // Find country to show in overlay (hovered or incorrect) using getCountryHighlight
    const overlayCountryData = countries.find(({ country }) => {
        const highlight = getCountryHighlight(country);
        return highlight === 'hovered' || highlight === 'incorrect';
    });
    const overlayHighlight = overlayCountryData ? getCountryHighlight(overlayCountryData.country) : null;

    return (
        <div style={{ position: 'relative', width: '100%', height: '100%' }}>
            {/* Main SVG - semi-static, only updates on quiz state changes */}
            <svg
                viewBox={`${viewBox.x0} ${viewBox.y0} ${viewBox.width} ${viewBox.height}`}
                className='region-map'
                xmlns='http://www.w3.org/2000/svg'
            >
                {/* Shadow filter definition */}
                <defs>
                    <filter id='unanswered-shadow' x='-50%' y='-50%' width='200%' height='200%'>
                        <feDropShadow dx='0' dy='0' stdDeviation='1' floodOpacity='0.5' />
                    </filter>
                </defs>

                {/* Answered countries (no shadow) */}
                {answeredCountries.sort(sortCountries).map(({ country, feature }) => (
                    <Country
                        key={country.cca3}
                        country={country}
                        feature={feature}
                        pathGenerator={pathGenerator}
                        onCountryClick={onCountryClick}
                        onCountryHover={onCountryHover}
                        onCountryLeave={onCountryLeave}
                        highlightState={getMainHighlight(country)}
                    />
                ))}

                {/* Unanswered countries (with shadow) */}
                <g filter='url(#unanswered-shadow)'>
                    {unansweredCountries.sort(sortCountries).map(({ country, feature }) => (
                        <Country
                            key={country.cca3}
                            country={country}
                            feature={feature}
                            pathGenerator={pathGenerator}
                            onCountryClick={onCountryClick}
                            onCountryHover={onCountryHover}
                            onCountryLeave={onCountryLeave}
                            highlightState={getMainHighlight(country)}
                        />
                    ))}
                </g>
            </svg>

            {/* Overlay - renders hovered or incorrect country on top */}
            {overlayCountryData && overlayHighlight && (
                <svg
                    viewBox={`${viewBox.x0} ${viewBox.y0} ${viewBox.width} ${viewBox.height}`}
                    className='region-map-overlay'
                    xmlns='http://www.w3.org/2000/svg'
                >
                    <Country
                        key={overlayCountryData.country.cca3}
                        country={overlayCountryData.country}
                        feature={overlayCountryData.feature}
                        pathGenerator={pathGenerator}
                        onCountryClick={onCountryClick}
                        onCountryHover={onCountryHover}
                        onCountryLeave={onCountryLeave}
                        highlightState={overlayHighlight}
                    />
                </svg>
            )}
        </div>
    );
};

export default RegionMap;
