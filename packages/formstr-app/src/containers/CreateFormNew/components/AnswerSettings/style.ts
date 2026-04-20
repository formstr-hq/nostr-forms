import styled from "styled-components";

export default styled.div`
  .question {
    display: block;
    margin: 16px;
  }

  .right-answer {
    display: flex;
    flex-direction: column;
    margin: 10px;
    max-width: 100%;
    height: auto;
  }

  .divider {
    margin: 0;
  }

  .input-property {
    margin: 16px;
  }

  .property-title {
    display: block;
    margin: 12px 0;
  }

  .property-setting {
    display: flex;
    justify-content: space-between;
    margin: 12px 0;
    font-size: 14px;
    min-width: 14px;
  }

  .property-name {
    color: rgba(0, 0, 0, 0.45);
  }

  .delete-button {
    margin: 12px 16px;
    padding: 0;
    line-height: 16px;
    height: 20px;
  }
`;
