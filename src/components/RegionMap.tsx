import { useState, useEffect, useMemo, memo, useRef, useCallback } from 'react';
import { geoPath, geoNaturalEarth1, geoMercatorRaw, geoMercator } from 'd3-geo';
import clsx from 'clsx';

import type { Feature, FeatureCollection, GeoJsonProperties, Geometry } from 'geojson';
import { getCountriesByRegion, type CountryData } from '../utils/countryData.js';
import type { Region } from '../types/countries-json.js';
import type { GeoPath } from 'd3-geo';

import './RegionMap.css';

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
    incorrectCountry?: CountryData | null;
}

interface CountryProps {
    country: CountryData;
    feature: FeatureCollection | Feature<Geometry, GeoJsonProperties>;
    pathGenerator: GeoPath;
    onCountryClick: (country: CountryData, event: React.MouseEvent<SVGPathElement>) => void;
    onCountryHover: (country: CountryData, event: React.MouseEvent<SVGPathElement>) => void;
    onCountryLeave: () => void;
    highlightState: 'correct' | 'incorrect' | 'hovered' | null;
}

const DEBUG_COUNTRY_MEMO = true;

/**
 * Memoized Country component - only re-renders when its props change
 */
const Country = memo<CountryProps>(
    ({ country, feature, pathGenerator, onCountryClick, onCountryHover, onCountryLeave, highlightState }) => {
        // Debug: Track which props changed
        const prevProps = useRef<CountryProps | undefined>(undefined);

        useEffect(() => {
            if (!DEBUG_COUNTRY_MEMO) return;

            if (prevProps.current) {
                const changed: string[] = [];
                if (prevProps.current.country !== country) changed.push('country');
                if (prevProps.current.feature !== feature) changed.push('feature');
                if (prevProps.current.pathGenerator !== pathGenerator) changed.push('pathGenerator');
                if (prevProps.current.onCountryClick !== onCountryClick) changed.push('onCountryClick');
                if (prevProps.current.onCountryHover !== onCountryHover) changed.push('onCountryHover');
                if (prevProps.current.onCountryLeave !== onCountryLeave) changed.push('onCountryLeave');
                if (prevProps.current.highlightState !== highlightState) changed.push('highlightState');

                if (changed.length > 0) {
                    console.log(`[${country.cca3}] Props changed:`, changed.join(', '));
                }
            }
            prevProps.current = {
                country,
                feature,
                pathGenerator,
                onCountryClick,
                onCountryHover,
                onCountryLeave,
                highlightState,
            };
        });

        // Handle both single features and feature collections
        const features = feature.type === 'FeatureCollection' ? feature.features : [feature];

        return (
            <>
                {features.map((f: Feature<Geometry>, index: number) => {
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
                })}
            </>
        );
    },
);

Country.displayName = 'Country';

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
    incorrectCountry,
}: RegionMapProps) => {
    const [countries, setCountries] = useState<CountryGeoData[]>([]);
    const [loading, setLoading] = useState(true);
    const [hoveredCountry, setHoveredCountry] = useState<CountryData | null>(null);

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

        const projection = geoMercator()
            .fitSize([1000, 1000], featureCollection)
            .preclip((stream) => stream); // Disable antimeridian clipping

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
    const answeredCountries = countries.filter(({ country }) => isAnsweredCorrectly?.(country));
    const unansweredCountries = countries.filter(({ country }) => !isAnsweredCorrectly?.(country));

    // Wrapper handlers to track hover state locally
    const handleCountryHoverInternal = useCallback(
        (country: CountryData, event: React.MouseEvent<SVGPathElement>) => {
            if (!isAnsweredCorrectly?.(country)) {
                setHoveredCountry(country);
            }
            onCountryHover?.(country, event);
        },
        [onCountryHover],
    );

    const handleCountryLeaveInternal = useCallback(() => {
        setHoveredCountry(null);
        onCountryLeave?.();
    }, [onCountryLeave]);

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
        const highlight = getCountryHighlight?.(country);
        return highlight === 'correct' ? 'correct' : null;
    };

    // Determine which country to show in overlay (hovered or incorrect)
    const overlayCountry = hoveredCountry || incorrectCountry;
    const overlayHighlight = hoveredCountry ? 'hovered' : 'incorrect';
    const overlayCountryData = overlayCountry ? countries.find((c) => c.country.cca3 === overlayCountry.cca3) : null;

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
                        onCountryHover={handleCountryHoverInternal}
                        onCountryLeave={handleCountryLeaveInternal}
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
                            onCountryHover={handleCountryHoverInternal}
                            onCountryLeave={handleCountryLeaveInternal}
                            highlightState={getMainHighlight(country)}
                        />
                    ))}
                </g>
            </svg>

            {/* Overlay - renders hovered or incorrect country on top */}
            {overlayCountryData && (
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
                        onCountryHover={handleCountryHoverInternal}
                        onCountryLeave={handleCountryLeaveInternal}
                        highlightState={overlayHighlight}
                    />
                </svg>
            )}
        </div>
    );
};

export default RegionMap;
