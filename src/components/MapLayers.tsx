import clsx from 'clsx';
import type { Feature, FeatureCollection, GeoJsonProperties, Geometry } from 'geojson';
import type { GeoPath } from 'd3-geo';

import type { CountryData } from '../utils/countryData.js';
import type { ZoomableZone } from '../utils/zoomableZones.js';
import { Country } from './Country.js';
import { MapZone } from './MapZone.js';

import * as styles from './MapLayers.css.ts';

interface CountryGeoData {
    country: CountryData;
    feature: FeatureCollection | Feature<Geometry, GeoJsonProperties>;
}

interface MapLayersProps {
    answeredCountries: CountryGeoData[];
    unansweredCountries: CountryGeoData[];
    overlayCountryData: CountryGeoData | undefined;
    overlayHighlight: 'correct' | 'incorrect' | 'hovered' | null;
    zones: ZoomableZone[];
    isZoomed: boolean;
    hoveredZone: string | null;
    iconRadius: number;
    viewBox: string;
    pathGenerator: GeoPath;
    onCountryClick: (country: CountryData, event: React.MouseEvent<SVGPathElement>) => void;
    onCountryHover: (country: CountryData, event: React.MouseEvent<SVGPathElement>) => void;
    onCountryLeave: () => void;
    getMainHighlight: (country: CountryData) => 'correct' | null;
    handleZoomToZone: (zone: ZoomableZone) => void;
}

// Sort function for countries - simple sort by area
const sortCountries = (a: CountryGeoData, b: CountryGeoData) => {
    // Largest countries first (drawn behind)
    return b.country.area - a.country.area;
};

/**
 * Pure presentational component for rendering map SVG layers
 * Separated from RegionMap for better organization
 */
export const MapLayers = ({
    answeredCountries,
    unansweredCountries,
    overlayCountryData,
    overlayHighlight,
    zones,
    isZoomed,
    hoveredZone,
    iconRadius,
    viewBox,
    pathGenerator,
    onCountryClick,
    onCountryHover,
    onCountryLeave,
    getMainHighlight,
    handleZoomToZone,
}: MapLayersProps) => {
    return (
        <>
            {/* Main SVG - semi-static, only updates on quiz state changes */}
            <svg viewBox={viewBox} className={styles.svg} xmlns='http://www.w3.org/2000/svg'>
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
            <svg viewBox={viewBox} className={clsx(styles.overlay, styles.shadow)} xmlns='http://www.w3.org/2000/svg'>
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
            <svg viewBox={viewBox} className={clsx(styles.overlay, styles.noEvents)} xmlns='http://www.w3.org/2000/svg'>
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

            <svg viewBox={viewBox} className={clsx(styles.overlay, styles.noEvents)} xmlns='http://www.w3.org/2000/svg'>
                {/* Zoomable zone indicators (only when not zoomed) */}
                {!isZoomed &&
                    zones.map((zone) => (
                        <MapZone
                            key={zone.id}
                            zone={zone}
                            isHovered={hoveredZone === zone.id}
                            iconRadius={iconRadius}
                            onZoomClick={handleZoomToZone}
                        />
                    ))}
            </svg>
        </>
    );
};
