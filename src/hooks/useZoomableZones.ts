import { useMemo, useState, useCallback, useEffect, useRef } from 'react';
import type { GeoPath } from 'd3-geo';
import type { Feature, FeatureCollection, Geometry, GeoJsonProperties } from 'geojson';

import type { CountryData } from '../utils/countryData.js';
import { calculateZoomableZones, type ZoomableZone } from '../utils/zoomableZones.js';

interface ViewBox {
    x0: number;
    y0: number;
    width: number;
    height: number;
}

interface UseZoomableZonesParams {
    countries: Array<{ country: CountryData; feature: FeatureCollection | Feature<Geometry, GeoJsonProperties> }>;
    pathGenerator: GeoPath;
    viewBox: ViewBox;
    answeredCorrectlyCount: number; // Track correct answers for auto-close
    hasIncorrectFeedback: boolean; // Don't auto-close if showing incorrect feedback
    onCloseZoom?: () => void; // Optional callback to use when auto-closing (for animations)
}

interface UseZoomableZonesReturn {
    zones: ZoomableZone[];
    activeZone: ZoomableZone | null;
    zoomToZone: (zone: ZoomableZone) => void;
    closeZoom: () => void;
    isZoomed: boolean;
}

/**
 * Hook for managing zoomable zones
 * Calculates zones and manages zoom state
 */
export function useZoomableZones({
    countries,
    pathGenerator,
    viewBox,
    answeredCorrectlyCount,
    hasIncorrectFeedback,
    onCloseZoom,
}: UseZoomableZonesParams): UseZoomableZonesReturn {
    const [activeZone, setActiveZone] = useState<ZoomableZone | null>(null);
    const previousAnsweredCount = useRef(answeredCorrectlyCount);
    const previousIncorrectFeedback = useRef(hasIncorrectFeedback);

    // Calculate zones (memoized to avoid recalculation)
    const zones = useMemo(() => {
        if (countries.length === 0) return [];
        return calculateZoomableZones(countries, pathGenerator, viewBox);
    }, [countries, pathGenerator, viewBox]);

    // Zoom to a specific zone
    const zoomToZone = useCallback((zone: ZoomableZone) => {
        setActiveZone(zone);
    }, []);

    // Close zoom and return to full map
    const closeZoom = useCallback(() => {
        setActiveZone(null);
    }, []);

    // Use callback if provided (for animations), otherwise use direct closeZoom
    const doCloseZoom = useCallback(() => {
        if (onCloseZoom) {
            onCloseZoom();
        } else {
            closeZoom();
        }
    }, [onCloseZoom, closeZoom]);

    // Auto-close zoom after correct answer
    useEffect(() => {
        // Detect correct answer (count increased)
        const correctAnswerGiven = answeredCorrectlyCount > previousAnsweredCount.current;

        if (activeZone !== null && correctAnswerGiven) {
            // Correct answer while zoomed - close after delay
            const timer = setTimeout(doCloseZoom, 200);
            return () => clearTimeout(timer);
        }

        // Update previous count
        previousAnsweredCount.current = answeredCorrectlyCount;
        return; // Satisfy noImplicitReturns
    }, [answeredCorrectlyCount, activeZone, doCloseZoom]);

    // Close zoom when incorrect feedback is dismissed
    useEffect(() => {
        // Detect when incorrect feedback is dismissed (changes from true to false)
        const incorrectDismissed = previousIncorrectFeedback.current && !hasIncorrectFeedback;

        if (activeZone !== null && incorrectDismissed) {
            // Incorrect feedback dismissed - close zoom
            doCloseZoom();
        }

        // Update previous state
        previousIncorrectFeedback.current = hasIncorrectFeedback;
    }, [hasIncorrectFeedback, activeZone, doCloseZoom]);

    const isZoomed = activeZone !== null;

    return {
        zones,
        activeZone,
        zoomToZone,
        closeZoom,
        isZoomed,
    };
}
