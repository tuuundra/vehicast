import React from 'react';
import { Button, Icon, useToast } from '@chakra-ui/react';
import { DownloadIcon } from '@chakra-ui/icons';
import { generateDistributorReport } from '../../services/reportService';
import { TimeFrame } from '../NewDistributor/types';

interface ReportButtonProps {
  stateId: number | null;
  countyId: number | null;
  currentTimeFrame: TimeFrame;
  label?: string;
}

const ReportButton: React.FC<ReportButtonProps> = ({ 
  stateId, 
  countyId, 
  currentTimeFrame,
  label = "Generate Report" 
}) => {
  const toast = useToast();
  
  const handleGenerateReport = async () => {
    try {
      await generateDistributorReport(stateId, countyId, currentTimeFrame);
      toast({
        title: "Report Generated",
        description: "Your report has been downloaded successfully",
        status: "success",
        duration: 3000,
        isClosable: true,
        position: "bottom"
      });
    } catch (error) {
      console.error("Error generating report:", error);
      toast({
        title: "Error",
        description: "Failed to generate report",
        status: "error",
        duration: 3000,
        isClosable: true,
        position: "bottom"
      });
    }
  };

  return (
    <Button
      leftIcon={<Icon as={DownloadIcon} />}
      bg="gray.800"
      color="gray.300"
      borderWidth="1px"
      borderColor="gray.700"
      _hover={{ 
        bg: 'gray.700',
        borderColor: 'gray.600',
        color: 'white'
      }}
      _active={{
        bg: 'gray.700',
        transform: 'scale(0.98)'
      }}
      onClick={handleGenerateReport}
      mt={4}
      mb={2}
      py={6}
      px={8}
      fontSize="md"
      borderRadius="md"
      boxShadow="sm"
    >
      {label}
    </Button>
  );
};

export default ReportButton; 