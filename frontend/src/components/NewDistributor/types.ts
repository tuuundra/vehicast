import { ReactNode } from 'react';

/**
 * Type definitions for the NewDistributor components
 */

// Time frame options for filtering (future predictions)
export type TimeFrame = '7days' | '1month' | '3months' | '6months';

// Filter options for the distributor dashboard
export interface FilterOptions {
  timeFrame: TimeFrame;
  stateId: number | null;
  countyId: number | null;
}

export interface State {
  id: number;
  name: string;
  population?: number;
}

export interface County {
  id: number;
  name: string;
  stateId: number;
  population?: number;
}

export interface TimeFrameFilterProps {
  selectedTimeFrame: TimeFrame;
  onChange: (timeFrame: TimeFrame) => void;
}

export interface StateFilterProps {
  selectedState: number | null;
  onChange: (stateId: number | null) => void;
}

export interface CountyFilterProps {
  selectedState: number | null;
  selectedCounties: number[];
  onChange: (counties: number[]) => void;
}

export interface ContentWithFiltersProps {
  children: ReactNode;
}

// Define time frame options
export const TIME_FRAMES = [
  { label: '7 Days', value: '7days' as TimeFrame },
  { label: '1 Month', value: '1month' as TimeFrame },
  { label: '3 Months', value: '3months' as TimeFrame },
  { label: '6 Months', value: '6months' as TimeFrame },
];

// Define states from the regions.csv
export const STATES: State[] = [
  { id: 1, name: 'Virginia', population: 8535519 },
  { id: 2, name: 'California', population: 39538223 },
  { id: 3, name: 'Texas', population: 29145505 },
  { id: 4, name: 'New York', population: 20201249 },
  { id: 5, name: 'Florida', population: 21538187 },
];

// Counties from regions.csv
export const COUNTIES: County[] = [
  { id: 6, name: 'Fairfax County', stateId: 1, population: 1147532 },
  { id: 7, name: 'Virginia Beach', stateId: 1, population: 449974 },
  { id: 8, name: 'Loudoun County', stateId: 1, population: 413538 },
  { id: 9, name: 'Henrico County', stateId: 1, population: 330818 },
  { id: 10, name: 'Norfolk County', stateId: 1, population: 242803 },
  { id: 11, name: 'Los Angeles County', stateId: 2, population: 10014009 },
  { id: 12, name: 'San Diego County', stateId: 2, population: 3298634 },
  { id: 13, name: 'Orange County', stateId: 2, population: 3168044 },
  { id: 14, name: 'Riverside County', stateId: 2, population: 2418185 },
  { id: 15, name: 'San Bernardino County', stateId: 2, population: 2181654 },
  { id: 16, name: 'Harris County', stateId: 3, population: 4713325 },
  { id: 17, name: 'Dallas County', stateId: 3, population: 2635516 },
  { id: 18, name: 'Tarrant County', stateId: 3, population: 2102515 },
  { id: 19, name: 'Bexar County', stateId: 3, population: 2003554 },
  { id: 20, name: 'Travis County', stateId: 3, population: 1290188 },
  { id: 21, name: 'Kings County', stateId: 4, population: 2736074 },
  { id: 22, name: 'Queens County', stateId: 4, population: 2405464 },
  { id: 23, name: 'New York County', stateId: 4, population: 1694251 },
  { id: 24, name: 'Suffolk County', stateId: 4, population: 1526345 },
  { id: 25, name: 'Bronx County', stateId: 4, population: 1472654 },
  { id: 26, name: 'Miami-Dade County', stateId: 5, population: 2716940 },
  { id: 27, name: 'Broward County', stateId: 5, population: 1952778 },
  { id: 28, name: 'Palm Beach County', stateId: 5, population: 1496770 },
  { id: 29, name: 'Hillsborough County', stateId: 5, population: 1471968 },
  { id: 30, name: 'Orange County', stateId: 5, population: 1393452 },
]; 