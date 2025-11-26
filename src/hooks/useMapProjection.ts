import { useMemo } from 'react';
import { geoPath, geoMercator, type GeoStream } from 'd3-geo';
import type { Feature, FeatureCollection } from 'geojson';
import type { Region } from '../types/countries-json.js';

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

interface ViewBox {
    x0: number;
    y0: number;
    width: number;
    height: number;
}

interface UseMapProjectionParams {
    countries: Array<{ feature: FeatureCollection | Feature }>;
    region: Region;
}

interface UseMapProjectionReturn {
    pathGenerator: ReturnType<typeof geoPath>;
    viewBox: ViewBox;
}

/**
 * Hook for setting up D3 map projection and calculating viewBox
 * Memoized to only recalculate when countries or region change
 */
export function useMapProjection({ countries, region }: UseMapProjectionParams): UseMapProjectionReturn {
    return useMemo(() => {
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
    }, [countries, region]);
}
