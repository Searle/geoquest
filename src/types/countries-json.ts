/**
 * Full Country type from mledoze/countries repository
 * Reference: https://github.com/mledoze/countries
 */

export type Region = 'Americas' | 'Asia' |  'Africa' | 'Europe' | 'Oceania' | 'Antarctic';

interface Country {
  name: {
    common: string;
    official: string;
    native: Record<string, { official: string; common: string }>;
  };
  tld: string[];
  cca2: string;
  cca3: string;
  ccn3: string;
  cioc: string;
  independent: boolean;
  status: string;
  unMember: boolean;
  unRegionalGroup: string;
  currencies: Record<string, { name: string; symbol: string }>;
  idd: {
    root: string;
    suffixes: string[];
  };
  capital: string[];
  altSpellings: string[];
  region: Region;
  subregion: string;
  languages: Record<string, string>;
  translations: Record<string, { official: string; common: string }>;
  latlng: [number, number];
  landlocked: boolean;
  borders: string[];
  area: number;
  demonyms: Record<string, { f: string; m: string }>;
  flag: string;

  /*
  // Claude's electric dreams:
  maps?: {
    googleMaps?: string;
    openStreetMaps?: string;
  };
  population?: number;
  gini?: Record<string, number>;
  fifa?: string;
  car?: {
    signs?: string[];
    side?: string;
  };
  timezones?: string[];
  continents?: string[];
  flags?: {
    png?: string;
    svg?: string;
    alt?: string;
  };
  coatOfArms?: {
    png?: string;
    svg?: string;
  };
  startOfWeek?: string;
  capitalInfo?: {
    latlng?: [number, number];
  };
  postalCode?: {
    format?: string;
    regex?: string;
  };
  */
}

/**
 * Simplified Country type for our application
 * Only includes fields we actually use
 */
export type CountryData = Pick<
  Country,
  'name' | 'cca3' | 'region' | 'capital' | 'translations' | 'latlng' | 'area' | 'flag'
>;
