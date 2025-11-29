import clsx from 'clsx';

import type { ZoomableZone } from '../utils/zoomableZones.js';

import * as styles from './MapZone.css.ts';

interface MapZoneProps {
    zone: ZoomableZone;
    isHovered: boolean;
    iconRadius: number;
    onZoomClick: (zone: ZoomableZone) => void;
}

/**
 * Renders a zoomable zone with border and zoom icon
 */
export const MapZone = ({ zone, isHovered, iconRadius, onZoomClick }: MapZoneProps) => {
    const zoneWidth = zone.bounds.x1 - zone.bounds.x0;
    const zoneHeight = zone.bounds.y1 - zone.bounds.y0;
    // Icon positioned in top-right corner
    const iconX = zone.bounds.x1 - iconRadius / 2;
    const iconY = zone.bounds.y0 + iconRadius / 2;

    return (
        <g>
            {/* Zone border - visual indicator only */}
            <rect
                x={zone.bounds.x0}
                y={zone.bounds.y0}
                width={zoneWidth}
                height={zoneHeight}
                className={clsx(styles.zone, { [styles.zoneHover]: isHovered })}
                vectorEffect='non-scaling-stroke'
            />

            {/* Zoom icon - shown when zone is hovered, clickable */}
            {isHovered && (
                <g className={styles.iconGroup} onClick={() => onZoomClick(zone)}>
                    {/* Background circle */}
                    <circle cx={iconX} cy={iconY} r={iconRadius} className={styles.iconCircle} />
                    {/* Magnifying glass icon */}
                    <text x={iconX} y={iconY} fontSize={iconRadius * 1.2} className={styles.iconText}>
                        🔍
                    </text>
                </g>
            )}
        </g>
    );
};
