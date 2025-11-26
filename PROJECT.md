# GeoGuess

## Current Architecture

### Component Hierarchy

```
App.tsx
└── GameMap.tsx (smart component - state & logic)
    ├── RegionMap.tsx (map rendering)
    │   └── MapLayers.tsx (SVG layers)
    │       └── Country.tsx (memoized paths)
    └── CapitalQuiz2.tsx (multiple choice quiz)
```

### Game Modes

- `'discover'`: Free exploration with tooltips
- `'country'`: Click map to identify countries
- `'capital'`: Click map to match capital to country
- `'capital2'`: Multiple choice capital quiz (NEW)

### Custom Hooks

- `useQuiz`: Map-based quiz logic
- `useCapitalQuiz2`: Multiple choice quiz logic (NEW)
- `useMapProjection`: D3 projection setup
- `useZoomableZones`: Zoom region detection

### Utilities

- `countryData.ts`: Country filtering, name/capital getters
- `capitalSelection.ts`: Multiple choice option generation (NEW)
- `zoomableZones.ts`: Zone calculation

### Hauptstadt-Quiz2 Features

- ✅ Multiple choice format (4 options)
- ✅ Region-specific wrong answers
- ✅ Complete answer history tracking
- ✅ Newest-first answer display
- ✅ Auto-removal of wrong attempts on success
- ✅ Incorrect count tracking
- ✅ Completion screen
- ✅ Smooth animations
- ✅ Color-coded feedback
- ✅ Scrollable answer list
- ✅ Retry-on-failure (country goes to end)

## Next Steps / Future Enhancements

### Potential Improvements

- Add localStorage persistence for progress
- Add country flag display
- Add sound effects for correct/incorrect

### Code Quality

- Add E2E tests for quiz flow
