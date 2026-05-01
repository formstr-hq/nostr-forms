import styled from 'styled-components';

export const ChatWrapper = styled.div`
  width: 100%;
  margin-top: 8px;
  
  .ant-card {
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.09);
    border-radius: 8px;
    border: 1px solid var(--app-color-border-soft);
  }

  .ant-card-head {
    background-color: var(--app-color-bg-subtle);
  }
  
  .chat-footer-controls {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .footer-help-section {
    flex-grow: 1;
    position: relative;
  }

  .footer-help-section .ant-collapse-content {
    position: absolute;
    bottom: calc(100%); /* Position above the header */
    left: 0;
    right: 0;
    min-width: 400px;
    background-color: var(--app-color-bg-surface);
    border: 1px solid var(--app-color-border-soft);
    z-index: 10;
    border-radius: 8px;
    box-shadow: 0 -2px 8px rgba(0,0,0,0.1);
  }

  .ai-chat-button-success {
      background-color: var(--app-color-success);
      color: var(--app-color-bg-surface);
      border-color: var(--app-color-success);
  }

  .ai-chat-button-success:hover {
      background-color: var(--app-color-success-active);
      color: var(--app-color-bg-surface) !important;
      border-color: var(--app-color-success-active) !important;
  }

  .ai-chat-button-danger {
      background-color: var(--app-color-error);
      color: var(--app-color-bg-surface);
      border-color: var(--app-color-error);
  }

  .ai-chat-button-danger:hover {
      background-color: var(--app-color-error-active);
      color: var(--app-color-bg-surface) !important;
      border-color: var(--app-color-error-active) !important;
  }
`;

export const MessageList = styled.div`
  height: 300px;
  overflow-y: auto;
  margin-bottom: 0px;
  padding-right: 8px;
`;

export const MessageItem = styled.div<{ sender: 'user' | 'ai' }>`
  margin-bottom: 12px;
  display: flex;
  justify-content: ${props => (props.sender === 'user' ? 'flex-end' : 'flex-start')};

  .message-bubble {
    padding: 8px 12px;
    border-radius: 18px;
    max-width: 80%;
    background-color: ${props => (props.sender === 'user' ? 'var(--app-color-primary)' : 'var(--app-color-border-soft)')};
    color: ${props =>
      props.sender === 'user'
        ? 'var(--app-color-bg-surface)'
        : 'var(--app-color-text-default)'};
    word-wrap: break-word;
  }
`;