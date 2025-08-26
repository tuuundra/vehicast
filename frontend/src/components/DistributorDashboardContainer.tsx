import React, { useState, ReactNode } from 'react';
import { Box } from '@chakra-ui/react';
import CollapsibleSidebar from './CollapsibleSidebar';
import { 
  OverviewIcon, 
  ForecastIcon, 
  InventoryIcon, 
  PartsIcon, 
  SettingsIcon 
} from './DashboardIcons';

interface DashboardSection {
  id: string;
  label: string;
  icon: ReactNode;
  content: ReactNode;
}

interface DistributorDashboardContainerProps {
  children: ReactNode;
}

const DistributorDashboardContainer = ({ children }: DistributorDashboardContainerProps) => {
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

  // Currently only showing the main content (children)
  // In a full implementation, you'd have different content sections for each nav item
  return (
    <CollapsibleSidebar navItems={navItems} activeIndex={activeSection}>
      {children}
    </CollapsibleSidebar>
  );
};

export default DistributorDashboardContainer; 