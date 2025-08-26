import React from 'react';
import { Box, Tooltip } from '@chakra-ui/react';
import { ChevronRightIcon } from '@chakra-ui/icons';

interface SidebarHintProps {
  isExpanded: boolean;
}

const SidebarHint = ({ isExpanded }: SidebarHintProps) => {
  return (
    <Tooltip label="Hover to expand sidebar" placement="right" hasArrow isDisabled={isExpanded}>
      <Box
        position="fixed"
        top="50%"
        left={isExpanded ? "240px" : "55px"}
        transform="translateY(-50%)"
        bg="whiteAlpha.100"
        color="white"
        borderRadius="0 4px 4px 0"
        p={1}
        opacity={isExpanded ? 0 : 0.7}
        transition="all 0.3s"
        zIndex={11}
        _hover={{ opacity: 1 }}
      >
        <ChevronRightIcon boxSize={5} />
      </Box>
    </Tooltip>
  );
};

export default SidebarHint; 