import styled from "styled-components";

export default styled.div`
  background-color: white;
  overflow: auto;
  .divider {
    margin: 0;
  }

  .form-setting {
    margin: 16px;
  }

  .property-setting {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin: 12px 0;
    font-size: 14px;
  }

  .sharing-settings {
    display: flex;
    justify-content: space-between;
    flex-direction: column;
    margin: 12px 0;
    font-size: 14px;
    min-width: 14px;
  }

  .file-input {
    border: 1px solid var(--app-color-bg-canvas);
    border-radius: 10px;
    padding: 10px;
    width: 100%;
    box-sizing: border-box;

  .warning-text {
    font-size: 12px;
    color: #ea8dea;
    display: block;
    margin-top: 4px;
  }

  .warning-text a {
    color: #ea8dea;
    text-decoration: underline;
  }

  .file-input:focus {
    outline: none;
    border: 1px solid var(--app-color-bg-canvas);
    box-shadow: 0 0 10px #f00; /* Consider a less aggressive focus color */
    border-radius: 10px;
  }

  .npub-list {
    list-style: circle;
    padding-left: 20px;
  }

  .npub-list-text {
    font-size: 12px;
    font-weight: normal;
  }

  .ant-collapse-header {
    padding: 0 !important;
  }

  .relay-text-container {
    text-overflow: ellipsis;
    overflow: hidden;
    margin-right: 8px;
  }


  .relay-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin: 5px;
    padding: 4px 0;

  .relay-item.read-only {
    display: flex;
    align-items: center;
    padding: 6px 0;
    margin: 0 5px;
  }

  .ant-collapse-content-box {
    padding-top: 0px;
    padding-bottom: 8px;
  }

  .ant-btn-icon-only {
    padding-top: 6px !important;
  }
`;
