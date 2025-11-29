import { useState, useEffect, useRef, useCallback } from 'react';
import type { Feature, FeatureCollection, GeoJsonProperties, Geometry } from 'geojson';

import { getCountriesByRegion, type CountryData } from '../utils/countryData.js';
import type { Region } from '../types/countries-json.js';
import { useZoomableZones } from '../hooks/useZoomableZones.js';
import type { ZoomableZone } from '../utils/zoomableZones.js';
import { useMapProjection } from '../hooks/useMapProjection.js';
import { MapLayers } from './MapLayers.js';

import * as styles from './RegionMap.css.ts';

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
    const [isZoomClosing, setIsZoomClosing] = useState(false);
    const [isZoomOpening, setIsZoomOpening] = useState(false);
    const savedScrollPosition = useRef(0);
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const svgContainerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const loadCountryData = async () => {
            const regionCountries = getCountriesByRegion(region);

            // Load GeoJSON for each country
            const countryDataPromises = regionCountries.map(async (country) => {
                try {
                    const response = await fetch(`data/countries/${country.cca3.toLowerCase()}.geo.json`);
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

    // Setup map projection
    const { pathGenerator, viewBox } = useMapProjection({ countries, region });

    // Create a ref to hold the close function to avoid circular dependency
    const closeZoomRef = useRef<(() => void) | null>(null);

    // Create animated close zoom callback
    const handleCloseZoom = useCallback(() => {
        setIsZoomClosing(true);
        // Wait for closing animation to complete
        setTimeout(() => {
            if (closeZoomRef.current) {
                closeZoomRef.current();
            }
            setIsZoomClosing(false);
            // Restore after a delay to let the DOM update
            requestAnimationFrame(() => {
                requestAnimationFrame(() => {
                    if (scrollContainerRef.current) {
                        scrollContainerRef.current.scrollTop = savedScrollPosition.current;
                    }
                });
            });
        }, 200); // Match animation duration
    }, []);

    // Zoomable zones
    const { zones, activeZone, zoomToZone, closeZoom, isZoomed } = useZoomableZones({
        countries,
        pathGenerator,
        viewBox,
        answeredCorrectlyCount,
        hasIncorrectFeedback,
        onCloseZoom: handleCloseZoom,
    });

    // Store closeZoom in ref so handleCloseZoom can use it
    closeZoomRef.current = closeZoom;

    // Wrapper to zoom to zone - save scroll position when opening zoom
    const handleZoomToZone = (zone: ZoomableZone) => {
        if (activeZone === null && scrollContainerRef.current) {
            // Only save if not already zoomed
            savedScrollPosition.current = scrollContainerRef.current.scrollTop;
        }
        setIsZoomOpening(true);
        // Wait for opening animation to complete
        setTimeout(() => {
            zoomToZone(zone);
            setIsZoomOpening(false);
        }, 200); // Match animation duration
    };

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
        if (isZoomed || !svgContainerRef.current) return; // Don't track when zoomed

        const svg = svgContainerRef.current.querySelector('svg') as SVGSVGElement;
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
        return <div className={styles.loading}>Karte wird geladen...</div>;
    }

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
        <div className={styles.container}>
            <div
                ref={scrollContainerRef}
                className={styles.inner}
                onMouseMove={handleMouseMove}
                onMouseLeave={handleMouseLeave}
            >
                <div ref={svgContainerRef}>
                    <MapLayers
                        answeredCountries={answeredCountries}
                        unansweredCountries={unansweredCountries}
                        overlayCountryData={overlayCountryData}
                        overlayHighlight={overlayHighlight}
                        zones={zones}
                        isZoomed={isZoomed}
                        hoveredZone={hoveredZone}
                        iconRadius={iconRadius}
                        viewBox={viewBox1}
                        pathGenerator={pathGenerator}
                        onCountryClick={onCountryClick}
                        onCountryHover={onCountryHover}
                        onCountryLeave={onCountryLeave}
                        getMainHighlight={getMainHighlight}
                        handleZoomToZone={handleZoomToZone}
                    />
                </div>
            </div>

            {/* Close button when zoomed */}
            {(isZoomed || isZoomClosing || isZoomOpening) && (
                <>
                    <div className={isZoomClosing ? styles.zoomBorderClosing : styles.zoomBorder}></div>
                    <div className={styles.zoomButtonContainer}>
                        <button
                            className={styles.zoomButton}
                            onClick={handleCloseZoom}
                            disabled={isZoomClosing || isZoomOpening}
                        >
                            ✕ &nbsp; Schliessen
                        </button>
                    </div>
                </>
            )}
        </div>
    );
};

export default RegionMap;
