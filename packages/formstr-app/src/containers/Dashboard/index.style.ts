import styled from "styled-components";

export default styled.div`
  .form-cards-container {
    display: flex;
    flex-direction: column;
    align-items: stretch;
    width: 100%;
    max-width: 760px;
    margin: 0 auto;
  }

  .form-card {
    width: 100%;
    margin: 10px 0;
  }

  .filter-dropdown-container {
    margin: 10px auto;
    width: 100%;
    max-width: 760px;
    display: flex;

    .ant-dropdown-trigger {
      width: 100%;
    }

    .ant-btn {
      width: 100%;
      display: flex;
      justify-content: center;
      align-items: center;
      background: transparent;
      border: none;
      box-shadow: none;
      color: inherit;

      &:hover,
      &:focus,
      &:active {
        background: rgba(0, 0, 0, 0.08);
        color: inherit;
        border: none;
        box-shadow: none;
      }
    }
    .anticon-down {
      position: relative;
      top: -2px;
      font-size: 12px;
    }
  }
`;
