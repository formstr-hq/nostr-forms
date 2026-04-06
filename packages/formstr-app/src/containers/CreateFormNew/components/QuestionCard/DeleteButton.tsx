import React, { useState, useRef, useEffect } from 'react';
import { DeleteOutlined } from "@ant-design/icons";
import { message } from 'antd';

interface DeleteButtonProps {
  onDelete: () => void;
  className?: string;
}

const DeleteButton: React.FC<DeleteButtonProps> = ({ onDelete, className }) => {
  const [showUndoDelete, setShowUndoDelete] = useState(false);
  const [messageApi, contextHolder] = message.useMessage();
  const timeoutRef = useRef<number>();
  const intervalRef = useRef<number>();
  const messageKeyRef = useRef<string>();
  
  const handleDelete = () => {
    setShowUndoDelete(true);
    let count = 2;
    
    messageKeyRef.current = `delete-${Date.now()}`;
    messageApi.loading({ 
      content: `Question will be deleted in ${count}s`,
      key: messageKeyRef.current,
      duration: 0 
    });
    
    intervalRef.current = window.setInterval(() => {
      count -= 1;
      messageApi.loading({ 
        content: `Question will be deleted in ${count}s`,
        key: messageKeyRef.current,
        duration: 0 
      });
    }, 1000);
    
    timeoutRef.current = window.setTimeout(() => {
      onDelete();
      setShowUndoDelete(false);
      messageApi.destroy(messageKeyRef.current);
      if (intervalRef.current) clearInterval(intervalRef.current);
    }, 2000);
  };

  const handleUndo = () => {
    window.clearTimeout(timeoutRef.current);
    window.clearInterval(intervalRef.current);
    setShowUndoDelete(false);
    if (messageKeyRef.current) {
      messageApi.success({ 
        content: 'Deletion cancelled',
        key: messageKeyRef.current,
        duration: 2 
      });
    }
  };

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (messageKeyRef.current) messageApi.destroy(messageKeyRef.current);
    };
  }, [messageApi]);

  return (
    <>
      {contextHolder}
      {showUndoDelete ? (
        <button className={className} style={{ color: "var(--app-color-error)" }} onClick={handleUndo}>↶</button>
      ) : (
        <DeleteOutlined className={className} style={{ color: "var(--app-color-error)" }} onClick={handleDelete} />
      )}
    </>
  );
};

export default DeleteButton;