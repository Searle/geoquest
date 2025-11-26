import type { Feature, FeatureCollection, Geometry, GeoJsonProperties } from 'geojson';
import type { GeoPath } from 'd3-geo';

import type { CountryData } from './countryData.js';

interface PolygonInfo {
    country: CountryData;
    geometry: Geometry;
    bounds: { x0: number; y0: number; x1: number; y1: number };
    area: number;
    centroid: [number, number];
}

export interface ZoomableZone {
    id: string;
    bounds: { x0: number; y0: number; x1: number; y1: number };
    polygons: PolygonInfo[];
    countries: CountryData[];
}

interface ViewBox {
    x0: number;
    y0: number;
    width: number;
    height: number;
}

/**
 * Calculate zoomable zones for small country polygons
 * Uses uniform-size zones placed at density hotspots
 */
export function calculateZoomableZones(
    countries: Array<{ country: CountryData; feature: FeatureCollection | Feature<Geometry, GeoJsonProperties> }>,
    pathGenerator: GeoPath,
    viewBox: ViewBox,
): ZoomableZone[] {
    // Phase 1: Extract and analyze individual polygons
    const allPolygons = extractPolygons(countries, pathGenerator);

    // Phase 2: Calculate largest polygon for each country
    const totalMapArea = viewBox.width * viewBox.height;
    const countryLargestPolygon = new Map<string, number>();

    for (const polygon of allPolygons) {
        const cca3 = polygon.country.cca3;

        if (['TUN', 'GNQ'].includes(cca3)) {
            console.log('calczoom2', cca3, polygon.area);
        }

        const currentLargest = countryLargestPolygon.get(cca3) ?? 0;
        // Track the largest polygon for this country
        countryLargestPolygon.set(cca3, Math.max(currentLargest, polygon.area));
    }

    // Phase 3: Identify small COUNTRIES
    // A country is "small" if its LARGEST polygon is < 1% of map
    // This excludes countries with visible main landmass (even if they have small islands)
    const smallCountryThreshold = totalMapArea * 0.001;
    const smallCountryCodes = new Set<string>();

    console.log('=== Zoomable Zone Detection ===');
    console.log('Total map area:', totalMapArea);
    console.log('Small country threshold (0.1%):', smallCountryThreshold);
    console.log('Country largest polygons:');

    // Always log specific islands we're interested in
    const watchList = ['REU', 'COM', 'MYT', 'MUS', 'SYC'];

    for (const [cca3, largestPolygonArea] of countryLargestPolygon.entries()) {
        const country = allPolygons.find((p) => p.country.cca3 === cca3)?.country;
        const isSmall = largestPolygonArea < smallCountryThreshold;
        const percentOfMap = ((largestPolygonArea / totalMapArea) * 100).toFixed(3);

        if (isSmall) {
            console.log(
                `  ✓ ${cca3} ${country?.name.common || cca3}: ${largestPolygonArea.toFixed(2)} (${percentOfMap}% of map) SMALL`,
            );
            smallCountryCodes.add(cca3);
        } else if (watchList.includes(cca3)) {
            console.log(
                `  ✗ ${cca3} ${country?.name.common || cca3}: ${largestPolygonArea.toFixed(2)} (${percentOfMap}% of map) TOO LARGE`,
            );
        }
    }

    console.log(`Total small countries: ${smallCountryCodes.size}`);

    // Filter to only include polygons from small countries
    const smallPolygons = allPolygons.filter((p) => smallCountryCodes.has(p.country.cca3));

    if (smallPolygons.length < 2) {
        // Not enough small polygons to create zones
        return [];
    }

    // Phase 4: Find density hotspots
    const hotspots = findDensityHotspots(smallPolygons, viewBox);

    console.log(`Found ${hotspots.length} density hotspots from ${smallPolygons.length} small polygons`);

    if (hotspots.length === 0) {
        console.log('No hotspots found - small countries are too isolated');
        return [];
    }

    // Phase 5: Place uniform-size zones at hotspots
    // Zone size should be large enough to contain all neighbors
    // Use the same scale as neighbor detection (15% of map)
    const zoneScale = 0.1;
    const zoneWidth = viewBox.width * zoneScale;
    const zoneHeight = viewBox.height * zoneScale;

    let zones = placeUniformZones(hotspots, smallPolygons, zoneWidth, zoneHeight, viewBox);

    // Phase 6: Resolve overlapping zones
    zones = resolveOverlaps(zones, viewBox);

    console.log(`Created ${zones.length} zoomable zones:`);
    zones.forEach((zone, i) => {
        const countryNames = zone.countries.map((c) => c.name.common).join(', ');
        console.log(`  Zone ${i + 1}: ${zone.polygons.length} polygons from [${countryNames}]`);
    });
    console.log('=== End Zoomable Zone Detection ===\n');

    return zones;
}

/**
 * Extract individual polygons from country features
 */
function extractPolygons(
    countries: Array<{ country: CountryData; feature: FeatureCollection | Feature<Geometry, GeoJsonProperties> }>,
    pathGenerator: GeoPath,
): PolygonInfo[] {
    const polygons: PolygonInfo[] = [];

    for (const { country, feature } of countries) {
        const features = feature.type === 'FeatureCollection' ? feature.features : [feature];

        for (const f of features) {
            if (!f.geometry) continue;

            if (f.geometry.type === 'Polygon') {
                const info = analyzePolygon(country, f.geometry, pathGenerator);
                if (info) polygons.push(info);
            } else if (f.geometry.type === 'MultiPolygon') {
                // Extract each polygon from MultiPolygon
                for (const polyCoords of f.geometry.coordinates) {
                    const singlePoly: Geometry = {
                        type: 'Polygon',
                        coordinates: polyCoords,
                    };
                    const info = analyzePolygon(country, singlePoly, pathGenerator);
                    if (info) polygons.push(info);
                }
            }
        }
    }

    return polygons;
}

/**
 * Analyze a single polygon and calculate its properties
 */
function analyzePolygon(country: CountryData, geometry: Geometry, pathGenerator: GeoPath): PolygonInfo | null {
    const bounds = pathGenerator.bounds({ type: 'Feature', properties: {}, geometry });

    if (!bounds || !isFinite(bounds[0][0])) {
        return null;
    }

    const [[x0, y0], [x1, y1]] = bounds;
    const area = (x1 - x0) * (y1 - y0);
    const centroid: [number, number] = [(x0 + x1) / 2, (y0 + y1) / 2];

    if (['TUN', 'GNQ'].includes(country.cca3)) {
        console.log('anapol', country.cca3, area);
    }

    return {
        country,
        geometry,
        bounds: { x0, y0, x1, y1 },
        area,
        centroid,
    };
}

/**
 * Find density hotspots using distance-based clustering
 */
function findDensityHotspots(polygons: PolygonInfo[], viewBox: ViewBox): Array<{ center: [number, number] }> {
    const hotspots: Array<{ center: [number, number]; count: number }> = [];
    const neighborRadius = Math.min(viewBox.width, viewBox.height) * 0.15; // 15% of map size
    const watchList = ['REU', 'COM', 'MYT', 'MUS', 'SYC'];

    console.log(
        `Neighbor detection radius: ${neighborRadius.toFixed(2)} (15% of ${Math.min(viewBox.width, viewBox.height).toFixed(2)})`,
    );

    for (const polygon of polygons) {
        // Count neighbors within radius
        let neighborCount = 0;
        const neighbors: string[] = [];
        for (const other of polygons) {
            if (polygon === other) continue;
            const distance = Math.sqrt(
                Math.pow(polygon.centroid[0] - other.centroid[0], 2) +
                    Math.pow(polygon.centroid[1] - other.centroid[1], 2),
            );
            if (distance < neighborRadius) {
                neighborCount++;
                if (watchList.includes(polygon.country.cca3)) {
                    neighbors.push(`${other.country.cca3}(${distance.toFixed(1)})`);
                }
            }
        }

        // Log for watched countries
        if (watchList.includes(polygon.country.cca3)) {
            if (neighborCount >= 1) {
                console.log(`  ${polygon.country.cca3} has ${neighborCount} neighbors: ${neighbors.join(', ')}`);
            } else {
                console.log(`  ${polygon.country.cca3} is isolated (no neighbors within ${neighborRadius.toFixed(2)})`);
            }
        }

        // If has at least 1 neighbor, it's a hotspot candidate
        if (neighborCount >= 1) {
            hotspots.push({
                center: polygon.centroid,
                count: neighborCount + 1, // Include self
            });
        }
    }

    // Merge nearby hotspots
    const mergedHotspots: Array<{ center: [number, number] }> = [];
    const mergeThreshold = neighborRadius * 0.5;

    for (const hotspot of hotspots) {
        let merged = false;
        for (const existing of mergedHotspots) {
            const distance = Math.sqrt(
                Math.pow(hotspot.center[0] - existing.center[0], 2) +
                    Math.pow(hotspot.center[1] - existing.center[1], 2),
            );
            if (distance < mergeThreshold) {
                // Update existing center to average
                existing.center[0] = (existing.center[0] + hotspot.center[0]) / 2;
                existing.center[1] = (existing.center[1] + hotspot.center[1]) / 2;
                merged = true;
                break;
            }
        }
        if (!merged) {
            mergedHotspots.push({ center: [...hotspot.center] });
        }
    }

    return mergedHotspots;
}

/**
 * Place dynamically-sized zones around polygon clusters
 */
function placeUniformZones(
    hotspots: Array<{ center: [number, number] }>,
    smallPolygons: PolygonInfo[],
    zoneWidth: number,
    zoneHeight: number,
    viewBox: ViewBox,
): ZoomableZone[] {
    const zones: ZoomableZone[] = [];
    const assignedPolygons = new Set<PolygonInfo>();

    for (let i = 0; i < hotspots.length; i++) {
        const hotspot = hotspots[i];

        // Find all polygons within the detection radius of this hotspot
        const clusterRadius = Math.max(zoneWidth, zoneHeight) * 0.75; // 75% of zone size
        const polygonsInCluster = smallPolygons.filter((p) => {
            if (assignedPolygons.has(p)) return false; // Already assigned to another zone
            const distance = Math.sqrt(
                Math.pow(p.centroid[0] - hotspot.center[0], 2) + Math.pow(p.centroid[1] - hotspot.center[1], 2),
            );
            return distance < clusterRadius;
        });

        if (polygonsInCluster.length > 0) {
            // Calculate bounding box of all polygons in this cluster
            let minX = Infinity,
                minY = Infinity,
                maxX = -Infinity,
                maxY = -Infinity;

            for (const polygon of polygonsInCluster) {
                minX = Math.min(minX, polygon.bounds.x0);
                minY = Math.min(minY, polygon.bounds.y0);
                maxX = Math.max(maxX, polygon.bounds.x1);
                maxY = Math.max(maxY, polygon.bounds.y1);
            }

            // Add padding to the bounding box
            const padding = Math.min(viewBox.width, viewBox.height) * 0.02; // 2% padding
            let bounds = {
                x0: minX - padding,
                y0: minY - padding,
                x1: maxX + padding,
                y1: maxY + padding,
            };

            // Clamp to viewBox bounds
            bounds.x0 = Math.max(bounds.x0, viewBox.x0);
            bounds.y0 = Math.max(bounds.y0, viewBox.y0);
            bounds.x1 = Math.min(bounds.x1, viewBox.x0 + viewBox.width);
            bounds.y1 = Math.min(bounds.y1, viewBox.y0 + viewBox.height);

            // Mark these polygons as assigned
            polygonsInCluster.forEach((p) => assignedPolygons.add(p));

            // Get unique countries
            const countries = Array.from(new Set(polygonsInCluster.map((p) => p.country)));

            zones.push({
                id: `zone-${i}`,
                bounds,
                polygons: polygonsInCluster,
                countries,
            });
        }
    }

    return zones;
}

/**
 * Clamp zone bounds to stay within viewBox
 */
function clampToViewBox(
    bounds: { x0: number; y0: number; x1: number; y1: number },
    viewBox: ViewBox,
    zoneWidth: number,
    zoneHeight: number,
): { x0: number; y0: number; x1: number; y1: number } {
    const viewBoxX1 = viewBox.x0 + viewBox.width;
    const viewBoxY1 = viewBox.y0 + viewBox.height;

    // If zone extends beyond bounds, shift it inward
    if (bounds.x0 < viewBox.x0) {
        bounds.x0 = viewBox.x0;
        bounds.x1 = viewBox.x0 + zoneWidth;
    }
    if (bounds.x1 > viewBoxX1) {
        bounds.x1 = viewBoxX1;
        bounds.x0 = viewBoxX1 - zoneWidth;
    }
    if (bounds.y0 < viewBox.y0) {
        bounds.y0 = viewBox.y0;
        bounds.y1 = viewBox.y0 + zoneHeight;
    }
    if (bounds.y1 > viewBoxY1) {
        bounds.y1 = viewBoxY1;
        bounds.y0 = viewBoxY1 - zoneHeight;
    }

    return bounds;
}

/**
 * Resolve overlapping zones by merging them based on actual overlap area
 */
function resolveOverlaps(zones: ZoomableZone[], viewBox: ViewBox): ZoomableZone[] {
    let changed = true;

    console.log(`\nResolving overlaps among ${zones.length} zones:`);

    while (changed) {
        changed = false;
        const newZones: ZoomableZone[] = [];

        for (let i = 0; i < zones.length; i++) {
            const zoneA = zones[i];
            let merged = false;

            for (let j = i + 1; j < zones.length; j++) {
                const zoneB = zones[j];

                // Calculate overlap area
                const overlapX0 = Math.max(zoneA.bounds.x0, zoneB.bounds.x0);
                const overlapY0 = Math.max(zoneA.bounds.y0, zoneB.bounds.y0);
                const overlapX1 = Math.min(zoneA.bounds.x1, zoneB.bounds.x1);
                const overlapY1 = Math.min(zoneA.bounds.y1, zoneB.bounds.y1);

                const overlapWidth = Math.max(0, overlapX1 - overlapX0);
                const overlapHeight = Math.max(0, overlapY1 - overlapY0);
                const overlapArea = overlapWidth * overlapHeight;

                const areaA = (zoneA.bounds.x1 - zoneA.bounds.x0) * (zoneA.bounds.y1 - zoneA.bounds.y0);
                const areaB = (zoneB.bounds.x1 - zoneB.bounds.x0) * (zoneB.bounds.y1 - zoneB.bounds.y0);

                // Determine which is smaller
                const smallerArea = Math.min(areaA, areaB);
                const overlapRatio = overlapArea / smallerArea;

                // Merge if >40% of the smaller zone overlaps with the larger
                if (overlapRatio > 0.4) {
                    console.log(
                        `  Merging ${zoneA.id} and ${zoneB.id} (overlap ratio: ${(overlapRatio * 100).toFixed(1)}%)`,
                    );

                    // Merge zones by recalculating bounding box of all polygons
                    const mergedPolygons = [...zoneA.polygons, ...zoneB.polygons];
                    const mergedCountries = Array.from(new Set([...zoneA.countries, ...zoneB.countries]));

                    // Calculate bounding box of merged polygons
                    let minX = Infinity,
                        minY = Infinity,
                        maxX = -Infinity,
                        maxY = -Infinity;

                    for (const polygon of mergedPolygons) {
                        minX = Math.min(minX, polygon.bounds.x0);
                        minY = Math.min(minY, polygon.bounds.y0);
                        maxX = Math.max(maxX, polygon.bounds.x1);
                        maxY = Math.max(maxY, polygon.bounds.y1);
                    }

                    // Add padding
                    const padding = Math.min(viewBox.width, viewBox.height) * 0.02;
                    let bounds = {
                        x0: minX - padding,
                        y0: minY - padding,
                        x1: maxX + padding,
                        y1: maxY + padding,
                    };

                    // Clamp to viewBox
                    bounds.x0 = Math.max(bounds.x0, viewBox.x0);
                    bounds.y0 = Math.max(bounds.y0, viewBox.y0);
                    bounds.x1 = Math.min(bounds.x1, viewBox.x0 + viewBox.width);
                    bounds.y1 = Math.min(bounds.y1, viewBox.y0 + viewBox.height);

                    newZones.push({
                        id: `${zoneA.id}-merged`,
                        bounds,
                        polygons: mergedPolygons,
                        countries: mergedCountries,
                    });

                    // Mark as merged and skip zoneB
                    zones.splice(j, 1);
                    changed = true;
                    merged = true;
                    break;
                }
            }

            if (!merged) {
                newZones.push(zoneA);
            }
        }

        zones = newZones;
    }

    return zones;
}
