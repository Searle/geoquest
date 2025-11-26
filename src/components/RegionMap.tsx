import { useState, useEffect, useMemo, useRef } from 'react';
import { geoPath, geoMercator, type GeoStream } from 'd3-geo';
import clsx from 'clsx';

import type { Feature, FeatureCollection, GeoJsonProperties, Geometry } from 'geojson';
import { getCountriesByRegion, type CountryData } from '../utils/countryData.js';
import type { Region } from '../types/countries-json.js';
import { Country } from './Country.js';
import { useZoomableZones } from '../hooks/useZoomableZones.js';
import type { ZoomableZone } from '../utils/zoomableZones.js';

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
    answeredCorrectlyCount: number; // For auto-close zoom
    hasIncorrectFeedback: boolean; // For auto-close zoom
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
    answeredCorrectlyCount,
    hasIncorrectFeedback,
}: RegionMapProps) => {
    const [countries, setCountries] = useState<CountryGeoData[]>([]);
    const [loading, setLoading] = useState(true);
    const [hoveredZone, setHoveredZone] = useState<string | null>(null);
    const [savedScrollPosition, setSavedScrollPosition] = useState(0);
    const previousActiveZone = useRef<ZoomableZone | null>(null);

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

    // Zoomable zones
    const {
        zones,
        activeZone,
        zoomToZone: zoomToZoneBase,
        closeZoom: closeZoomBase,
        isZoomed,
    } = useZoomableZones({
        countries,
        pathGenerator,
        viewBox,
        answeredCorrectlyCount,
        hasIncorrectFeedback,
    });

    // Wrapper to save scroll position before zooming
    const handleZoomToZone = (zone: ZoomableZone) => {
        // Save current scroll position
        const scrollContainer = document.querySelector('.game-content');
        if (scrollContainer) {
            setSavedScrollPosition(scrollContainer.scrollTop);
        }
        zoomToZoneBase(zone);
    };

    // Wrapper to restore scroll position when closing
    const handleCloseZoom = () => {
        closeZoomBase();
        // Restore scroll position after a brief delay (let render complete)
        setTimeout(() => {
            const scrollContainer = document.querySelector('.game-content');
            if (scrollContainer) {
                scrollContainer.scrollTop = savedScrollPosition;
            }
        }, 0);
    };

    // Restore scroll position when zoom closes (including auto-close)
    useEffect(() => {
        // Detect when zoom closes (activeZone changes from non-null to null)
        if (previousActiveZone.current !== null && activeZone === null) {
            // Zoom just closed - restore scroll position
            setTimeout(() => {
                const scrollContainer = document.querySelector('.game-content');
                if (scrollContainer) {
                    scrollContainer.scrollTop = savedScrollPosition;
                }
            }, 0);
        }

        // Update previous state
        previousActiveZone.current = activeZone;
    }, [activeZone, savedScrollPosition]);

    // Update viewBox when zoomed
    const displayViewBox = activeZone
        ? {
              x0: activeZone.bounds.x0,
              y0: activeZone.bounds.y0,
              width: activeZone.bounds.x1 - activeZone.bounds.x0,
              height: activeZone.bounds.y1 - activeZone.bounds.y0,
          }
        : viewBox;

    // Icon size relative to current viewBox (maintains consistent screen size)
    const iconRadius = displayViewBox.width * 0.01;

    // Mouse tracking for zone hover detection on parent container
    const handleMouseMove = (event: React.MouseEvent<HTMLDivElement>) => {
        if (isZoomed) return; // Don't track when zoomed

        const svg = event.currentTarget.querySelector('.region-map-svg') as SVGSVGElement;
        if (!svg) return;

        const rect = svg.getBoundingClientRect();

        // Convert screen coordinates to SVG coordinates
        const screenX = event.clientX - rect.left;
        const screenY = event.clientY - rect.top;

        const svgX = displayViewBox.x0 + (screenX / rect.width) * displayViewBox.width;
        const svgY = displayViewBox.y0 + (screenY / rect.height) * displayViewBox.height;

        // Check which zone contains this position
        const zone = zones.find(
            (z) => svgX >= z.bounds.x0 && svgX <= z.bounds.x1 && svgY >= z.bounds.y0 && svgY <= z.bounds.y1,
        );

        setHoveredZone(zone ? zone.id : null);
    };

    const handleMouseLeave = () => {
        setHoveredZone(null);
    };

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

    const viewBox1 = `${displayViewBox.x0} ${displayViewBox.y0} ${displayViewBox.width} ${displayViewBox.height}`;

    return (
        <div className='region-map'>
            <div className='region-map-inner' onMouseMove={handleMouseMove} onMouseLeave={handleMouseLeave}>
                {/* Main SVG - semi-static, only updates on quiz state changes */}
                <svg viewBox={viewBox1} className='region-map-svg' xmlns='http://www.w3.org/2000/svg'>
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
                </svg>
                <svg
                    viewBox={viewBox1}
                    className={clsx('region-map-overlay', 'region-map-shadow')}
                    xmlns='http://www.w3.org/2000/svg'
                >
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
                </svg>

                {/* Overlay - renders hovered or incorrect country on top */}
                <svg
                    viewBox={viewBox1}
                    className={clsx('region-map-overlay', 'region-map-no-events')}
                    xmlns='http://www.w3.org/2000/svg'
                >
                    {overlayCountryData && overlayHighlight && (
                        <Country
                            key={overlayCountryData.country.cca3}
                            country={overlayCountryData.country}
                            feature={overlayCountryData.feature}
                            pathGenerator={pathGenerator}
                            onCountryClick={onCountryClick}
                            onCountryHover={onCountryHover}
                            onCountryLeave={onCountryLeave}
                            highlightState={overlayHighlight}
                            forOverlay
                        />
                    )}
                </svg>

                <svg
                    viewBox={viewBox1}
                    className={clsx('region-map-overlay', 'region-map-no-events')}
                    xmlns='http://www.w3.org/2000/svg'
                >
                    {/* Zoomable zone indicators (only when not zoomed) */}
                    {!isZoomed &&
                        zones.map((zone) => {
                            const zoneWidth = zone.bounds.x1 - zone.bounds.x0;
                            const zoneHeight = zone.bounds.y1 - zone.bounds.y0;
                            // Icon positioned in top-right corner
                            const iconX = zone.bounds.x1 - iconRadius - 1;
                            const iconY = zone.bounds.y0 + iconRadius + 1;

                            return (
                                <g key={zone.id}>
                                    {/* Zone border - visual indicator only */}
                                    <rect
                                        x={zone.bounds.x0}
                                        y={zone.bounds.y0}
                                        width={zoneWidth}
                                        height={zoneHeight}
                                        className='zoomable-zone'
                                        vectorEffect='non-scaling-stroke'
                                    />

                                    {/* Zoom icon - shown when zone is hovered, clickable */}
                                    {hoveredZone === zone.id && (
                                        <g
                                            style={{ cursor: 'pointer', pointerEvents: 'all' }}
                                            onClick={() => handleZoomToZone(zone)}
                                        >
                                            {/* Background circle */}
                                            <circle
                                                cx={iconX}
                                                cy={iconY}
                                                r={iconRadius}
                                                fill='white'
                                                stroke='#2c3e50'
                                                strokeWidth='1'
                                                opacity='0.95'
                                                vectorEffect='non-scaling-stroke'
                                            />
                                            {/* Magnifying glass icon */}
                                            <text
                                                x={iconX}
                                                y={iconY}
                                                fontSize={iconRadius * 1.2}
                                                textAnchor='middle'
                                                dominantBaseline='central'
                                                fill='#2c3e50'
                                                style={{ pointerEvents: 'none' }}
                                            >
                                                🔍
                                            </text>
                                        </g>
                                    )}
                                </g>
                            );
                        })}
                </svg>
            </div>

            {/* Close button when zoomed */}
            {isZoomed && (
                <button className='zoom-close-button' onClick={handleCloseZoom}>
                    ✕ Schliessen
                </button>
            )}
        </div>
    );
};

export default RegionMap;
