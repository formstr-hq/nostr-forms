import React, { useState, useEffect } from 'react';
import { Button } from 'antd';
import { ThunderboltOutlined } from '@ant-design/icons';
import { SupportUsModal, prefetchSupportInfo } from './SupportUsModal';

const FORMSTR_NPUB = 'npub1qu7dsd44275lms4x9snnwvnnmgx926nsppmr7lcw9dlj36n4fltqgs7p98';

interface SupportUsButtonProps {
  npub?: string;
  buttonText?: string;
  type?: 'primary' | 'default' | 'dashed' | 'link' | 'text';
  style?: React.CSSProperties;
}

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
        type={type}
        onClick={() => setIsModalOpen(true)}
        style={style}
      >
        <span>{buttonText}</span>
        {/* Override Ant Design's automatic gap behavior with inline styles */}
        <ThunderboltOutlined style={{ color: '#fadb14', marginLeft: '4px' }} />
      </Button>

      <SupportUsModal
        open={isModalOpen}
        npub={npub}
        onClose={() => setIsModalOpen(false)}
      />
    </>
  );
};
