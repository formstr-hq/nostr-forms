import styled from "styled-components";

export default styled.div`
  .header {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
`;

export const InputStyle = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;

  .number-input {
    border: 1px solid var(--app-color-bg-canvas);
    border-radius: 10px;
    padding: 10px;
    width: 50%;
  }

  .number-input:focus {
    outline: none;
    border: 1px solid var(--app-color-bg-canvas);
    box-shadow: 0 0 10px #f00;
    border-radius: 10px;
  }
`;
