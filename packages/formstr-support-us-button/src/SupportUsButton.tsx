import React, { useState, useEffect } from 'react';
import Button from '@mui/material/Button';
import BoltIcon from '@mui/icons-material/Bolt';
import { SupportUsModal, prefetchSupportInfo } from './SupportUsModal';

const FORMSTR_NPUB = 'npub1qu7dsd44275lms4x9snnwvnnmgx926nsppmr7lcw9dlj36n4fltqgs7p98';

// Kept as the antd-style union for call-site compatibility; mapped to MUI variants.
type LegacyButtonType = 'primary' | 'default' | 'dashed' | 'link' | 'text';

interface SupportUsButtonProps {
  npub?: string;
  buttonText?: string;
  type?: LegacyButtonType;
  style?: React.CSSProperties;
}

const VARIANT_BY_TYPE: Record<LegacyButtonType, 'contained' | 'outlined' | 'text'> = {
  primary: 'contained',
  default: 'outlined',
  dashed: 'outlined',
  link: 'text',
  text: 'text',
};

export const SupportUsButton: React.FC<SupportUsButtonProps> = ({
  npub = FORMSTR_NPUB,
  buttonText = 'Support Us',
  type = 'default',
  style,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    prefetchSupportInfo(npub);
  }, [npub]);

  return (
    <>
      <Button
        variant={VARIANT_BY_TYPE[type]}
        onClick={() => setIsModalOpen(true)}
        style={style}
        endIcon={<BoltIcon sx={{ color: '#fadb14' }} />}
      >
        {buttonText}
      </Button>

      <SupportUsModal
        open={isModalOpen}
        npub={npub}
        onClose={() => setIsModalOpen(false)}
      />
    </>
  );
};
