import styled from 'styled-components';

export const ChatWrapper = styled.div`
  width: 100%;
  height: 100%;
  
  .ant-card {
    height: 100%;
    display: flex;
    flex-direction: column;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.09);
    border-radius: 8px;
    border: 1px solid #f0f0f0;
  }

  .ant-card-body {
    flex: 1;
    min-height: 0;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .ant-card-head {
    background-color: #fafafa;
  }
  
  .chat-footer-controls {
    display: flex;
    justify-content: flex-end;
    align-items: center;
    margin-top: 4px;
  }

  .ai-chat-button-success {
      background-color: #00796b;
      color: white;
      border-color: #00796b;
  }

  .ai-chat-button-success:hover {
      background-color: #004d40;
      color: white !important;
      border-color: #004d40 !important;
  }

  .ai-chat-button-danger {
      background-color: #d32f2f;
      color: white;
      border-color: #d32f2f;
  }

  .ai-chat-button-danger:hover {
      background-color: #c62828;
      color: white !important;
      border-color: #c62828 !important;
  }
`;

export const MessageList = styled.div`
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  margin-bottom: 0px;
  padding-right: 8px;

  &::-webkit-scrollbar {
    width: 5px;
  }

  &::-webkit-scrollbar-track {
    background: transparent;
  }

  &::-webkit-scrollbar-thumb {
    background: rgba(120, 120, 120, 0.4);
    border-radius: 999px;
  }

  &::-webkit-scrollbar-thumb:hover {
    background: rgba(120, 120, 120, 0.6);
  }

  scrollbar-width: thin;
  scrollbar-color: rgba(120, 120, 120, 0.5) transparent;
`;

export const MessageItem = styled.div<{ sender: 'user' | 'ai' }>`
  margin-bottom: 12px;
  display: flex;
  justify-content: ${props => (props.sender === 'user' ? 'flex-end' : 'flex-start')};

  .message-bubble {
    padding: 8px 12px;
    border-radius: 18px;
    max-width: 80%;
    background-color: ${props => (props.sender === 'user' ? '#FF5733' : '#f0f0f0')};
    color: ${props => (props.sender === 'user' ? 'white' : 'black')};
    word-wrap: break-word;
  }
`;