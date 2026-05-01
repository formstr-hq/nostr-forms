import styled from 'styled-components';
import { RelayStatus } from '../../containers/CreateFormNew/providers/FormBuilder/typeDefs'; // Adjust path as needed

interface StyledRelayStatusDotProps {
  status: RelayStatus;
}

const statusColors: Record<RelayStatus, string> = {
  connected: 'var(--app-color-success)',
  pending: 'var(--app-color-warning)',
  error: 'var(--app-color-error)',
  unknown: 'var(--app-color-border)',
};

const StyledRelayStatusDot = styled.span<StyledRelayStatusDotProps>`
  display: inline-block;
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background-color: ${(props) => statusColors[props.status] || statusColors.unknown};
  margin-right: 8px;
  vertical-align: middle;
`;

export default StyledRelayStatusDot;