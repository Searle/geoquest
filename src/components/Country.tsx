import { memo, useRef, useEffect } from 'react';
import clsx from 'clsx';
import type { FeatureCollection, Feature, Geometry, GeoJsonProperties } from 'geojson';
import type { GeoPath } from 'd3-geo';

import type { CountryData } from '../types/countries-json.js';

import './Country.css';

export const DEBUG_COUNTRY_MEMO = false;

export interface CountryProps {
    country: CountryData;
    feature: FeatureCollection | Feature<Geometry, GeoJsonProperties>;
    pathGenerator: GeoPath;
    onCountryClick: (country: CountryData, event: React.MouseEvent<SVGPathElement>) => void;
    onCountryHover: (country: CountryData, event: React.MouseEvent<SVGPathElement>) => void;
    onCountryLeave: () => void;
    highlightState: 'correct' | 'incorrect' | 'hovered' | null;
    forOverlay?: true;
}

/**
 * Memoized Country component - only re-renders when its props change
 */
export const Country = memo<CountryProps>(
    ({
        country,
        feature,
        pathGenerator,
        onCountryClick,
        onCountryHover,
        onCountryLeave,
        highlightState,
        forOverlay,
    }) => {
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
                    const hitAreaSize = country.area < 30000 ? 16 : country.area < 100000 ? 8 : 0;

                    const handlers = {
                        onMouseMove: (e: React.MouseEvent<SVGPathElement, MouseEvent>) => onCountryHover(country, e),
                        onMouseLeave: () => onCountryLeave(),
                        onClick: (e: React.MouseEvent<SVGPathElement, MouseEvent>) => onCountryClick(country, e),
                    };

                    return (
                        <g key={`${country.cca3}-${index}`}>
                            {/* Invisible hit area with thick stroke for edges and fill for interior */}
                            {!forOverlay && hitAreaSize > 0 && (
                                <path
                                    d={pathData}
                                    className='country-hit-area'
                                    strokeWidth={hitAreaSize}
                                    {...handlers}
                                />
                            )}
                            {/* Visible path */}
                            <path
                                d={pathData}
                                className={clsx('country', {
                                    hovered: highlightState === 'hovered',
                                    'quiz-target': highlightState === 'correct',
                                    'quiz-incorrect': highlightState === 'incorrect',
                                    'country-no-pointer': forOverlay || hitAreaSize > 0,
                                })}
                                data-country={country.cca3}
                                vectorEffect='non-scaling-stroke'
                                {...(forOverlay || hitAreaSize > 0 ? {} : handlers)}
                            />
                        </g>
                    );
                })}
            </>
        );
    },
);

Country.displayName = 'Country';
