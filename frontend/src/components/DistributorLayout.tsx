import React, { ReactNode, useState } from 'react';
import { Box } from '@chakra-ui/react';
import CollapsibleSidebar from './ui/sidebar';
import { 
  OverviewIcon, 
  ForecastIcon, 
  InventoryIcon, 
  PartsIcon, 
  SettingsIcon 
} from './DashboardIcons';

interface DistributorLayoutProps {
  children: ReactNode;
}

const DistributorLayout = ({ children }: DistributorLayoutProps) => {
  const [activeSection, setActiveSection] = useState(0);

  const navItems = [
    {
      icon: <OverviewIcon boxSize={6} />,
      label: "Overview",
      onClick: () => setActiveSection(0)
    },
    {
      icon: <ForecastIcon boxSize={6} />,
      label: "Demand Forecast",
      onClick: () => setActiveSection(1)
    },
    {
      icon: <InventoryIcon boxSize={6} />,
      label: "Inventory",
      onClick: () => setActiveSection(2)
    },
    {
      icon: <PartsIcon boxSize={6} />,
      label: "Parts Management",
      onClick: () => setActiveSection(3)
    },
    {
      icon: <SettingsIcon boxSize={6} />,
      label: "Settings",
      onClick: () => setActiveSection(4)
    }
  ];

  return (
    <CollapsibleSidebar navItems={navItems} activeIndex={activeSection}>
      {children}
    </CollapsibleSidebar>
  );
};

export default DistributorLayout; 