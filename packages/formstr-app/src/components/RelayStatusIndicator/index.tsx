import React from 'react';
import { Tooltip } from '@mui/material';
import { RelayStatus } from '../../containers/CreateFormNew/providers/FormBuilder/typeDefs'; // Adjust path as needed
import StyledRelayStatusDot from './style';

interface RelayStatusIndicatorProps {
  status: RelayStatus;
}

const statusTooltips: Record<RelayStatus, string> = {
  connected: 'Connected',
  pending: 'Connecting...',
  error: 'Connection Error',
  unknown: 'Status Unknown',
};

const RelayStatusIndicator: React.FC<RelayStatusIndicatorProps> = ({ status }) => {
  return (
    <Tooltip title={statusTooltips[status] || 'Unknown Status'}>
      <StyledRelayStatusDot status={status} />
    </Tooltip>
  );
};

export default RelayStatusIndicator;