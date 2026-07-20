import styled from "styled-components";

export default styled.div`
  .menu-divider {
    margin: 0;
  }

  .create-sidebar {
    height: calc(100vh - 64px);
    height: calc(100dvh - 64px);
    border-inline-end: 1px solid rgba(5, 5, 5, 0.06);
    margin-top: 1px;
    background-color: white;
  }

  .create-sidebar .ant-menu .ant-menu-item-group .ant-menu-item-group-title {
    padding: 16px 20px 8px;
  }

  .create-sidebar .ant-menu .ant-menu-item-group .ant-menu-item {
    padding: 0 12px;
    line-height: 36px;
    min-height: 36px;
    max-height: 38px;
    margin: 0 8px 4px 8px;
    width: calc(100% - 16px);
  }
`;
