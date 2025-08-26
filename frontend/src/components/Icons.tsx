import React from 'react';

interface IconProps {
  color?: string;
  size?: string | number;
  className?: string;
}

// Simple SVG icon components
export const ChartLineIcon: React.FC<IconProps> = ({ color = "currentColor", size = "1em", className }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    viewBox="0 0 512 512" 
    width={size} 
    height={size} 
    fill={color}
    className={className}
  >
    <path d="M64 64c0-17.7-14.3-32-32-32S0 46.3 0 64V400c0 44.2 35.8 80 80 80H480c17.7 0 32-14.3 32-32s-14.3-32-32-32H80c-8.8 0-16-7.2-16-16V64zm96 288c17.7 0 32-14.3 32-32v-64c0-17.7-14.3-32-32-32s-32 14.3-32 32v64c0 17.7 14.3 32 32 32zm128-32c0 17.7 14.3 32 32 32s32-14.3 32-32V192c0-17.7-14.3-32-32-32s-32 14.3-32 32V320zm224-96c0-17.7-14.3-32-32-32s-32 14.3-32 32v96c0 17.7 14.3 32 32 32s32-14.3 32-32V224z"/>
  </svg>
);

export const CarAltIcon: React.FC<IconProps> = ({ color = "currentColor", size = "1em", className }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    viewBox="0 0 512 512" 
    width={size} 
    height={size} 
    fill={color}
    className={className}
  >
    <path d="M135.2 117.4L109.1 192H402.9l-26.1-74.6C372.3 104.6 360.2 96 346.6 96H165.4c-13.6 0-25.7 8.6-30.2 21.4zM39.6 196.8L74.8 96.3C88.3 57.8 124.6 32 165.4 32H346.6c40.8 0 77.1 25.8 90.6 64.3l35.2 100.5c23.2 9.6 39.6 32.5 39.6 59.2V400v48c0 17.7-14.3 32-32 32H448c-17.7 0-32-14.3-32-32V400H96v48c0 17.7-14.3 32-32 32H32c-17.7 0-32-14.3-32-32V400 256c0-26.7 16.4-49.6 39.6-59.2zM128 288c0-17.7-14.3-32-32-32s-32 14.3-32 32s14.3 32 32 32s32-14.3 32-32zm288 32c17.7 0 32-14.3 32-32s-14.3-32-32-32s-32 14.3-32 32s14.3 32 32 32z"/>
  </svg>
);

export const CalendarAltIcon: React.FC<IconProps> = ({ color = "currentColor", size = "1em", className }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    viewBox="0 0 448 512" 
    width={size} 
    height={size} 
    fill={color}
    className={className}
  >
    <path d="M96 32V64H48C21.5 64 0 85.5 0 112v48H448V112c0-26.5-21.5-48-48-48H352V32c0-17.7-14.3-32-32-32s-32 14.3-32 32V64H160V32c0-17.7-14.3-32-32-32S96 14.3 96 32zM448 192H0V464c0 26.5 21.5 48 48 48H400c26.5 0 48-21.5 48-48V192z"/>
  </svg>
);

export const MoneyBillWaveIcon: React.FC<IconProps> = ({ color = "currentColor", size = "1em", className }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    viewBox="0 0 576 512" 
    width={size} 
    height={size} 
    fill={color}
    className={className}
  >
    <path d="M0 112.5V422.3c0 18 10.1 35 27 41.3c87 32.5 174 10.3 261-11.9c79.8-20.3 159.6-40.7 239.3-18.9c23 6.3 48.7-9.5 48.7-33.4V89.7c0-18-10.1-35-27-41.3C462 15.9 375 38.1 288 60.3C208.2 80.6 128.4 100.9 48.7 79.1C25.6 72.8 0 88.6 0 112.5zM288 352c-44.2 0-80-43-80-96s35.8-96 80-96s80 43 80 96s-35.8 96-80 96zM64 176c0 8.8 7.2 16 16 16h32c8.8 0 16-7.2 16-16s-7.2-16-16-16H80c-8.8 0-16 7.2-16 16zm400 16c8.8 0 16-7.2 16-16s-7.2-16-16-16H432c-8.8 0-16 7.2-16 16s7.2 16 16 16h32zM64 240c0 8.8 7.2 16 16 16h32c8.8 0 16-7.2 16-16s-7.2-16-16-16H80c-8.8 0-16 7.2-16 16zm400 16c8.8 0 16-7.2 16-16s-7.2-16-16-16H432c-8.8 0-16 7.2-16 16s7.2 16 16 16h32zM64 304c0 8.8 7.2 16 16 16h32c8.8 0 16-7.2 16-16s-7.2-16-16-16H80c-8.8 0-16 7.2-16 16zm400 16c8.8 0 16-7.2 16-16s-7.2-16-16-16H432c-8.8 0-16 7.2-16 16s7.2 16 16 16h32z"/>
  </svg>
);

export const InfoCircleIcon: React.FC<IconProps> = ({ color = "currentColor", size = "1em", className }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    viewBox="0 0 512 512" 
    width={size} 
    height={size} 
    fill={color}
    className={className}
  >
    <path d="M256 512A256 256 0 1 0 256 0a256 256 0 1 0 0 512zM216 336h24V272H216c-13.3 0-24-10.7-24-24s10.7-24 24-24h48c13.3 0 24 10.7 24 24v88h8c13.3 0 24 10.7 24 24s-10.7 24-24 24H216c-13.3 0-24-10.7-24-24s10.7-24 24-24zm40-208a32 32 0 1 1 0 64 32 32 0 1 1 0-64z"/>
  </svg>
);

export const ArrowUpIcon: React.FC<IconProps> = ({ color = "currentColor", size = "1em", className }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    viewBox="0 0 384 512" 
    width={size} 
    height={size} 
    fill={color}
    className={className}
  >
    <path d="M214.6 41.4c-12.5-12.5-32.8-12.5-45.3 0l-160 160c-12.5 12.5-12.5 32.8 0 45.3s32.8 12.5 45.3 0L160 141.2V448c0 17.7 14.3 32 32 32s32-14.3 32-32V141.2L329.4 246.6c12.5 12.5 32.8 12.5 45.3 0s12.5-32.8 0-45.3l-160-160z"/>
  </svg>
);

export const ArrowDownIcon: React.FC<IconProps> = ({ color = "currentColor", size = "1em", className }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    viewBox="0 0 384 512" 
    width={size} 
    height={size} 
    fill={color}
    className={className}
  >
    <path d="M169.4 470.6c12.5 12.5 32.8 12.5 45.3 0l160-160c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0L224 370.8V64c0-17.7-14.3-32-32-32s-32 14.3-32 32V370.8L54.6 265.4c-12.5-12.5-32.8-12.5-45.3 0s-12.5 32.8 0 45.3l160 160z"/>
  </svg>
); 