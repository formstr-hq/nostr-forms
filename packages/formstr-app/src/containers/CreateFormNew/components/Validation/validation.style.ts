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
    border: 1px solid #dedede;
    border-radius: 10px;
    padding: 10px;
    width: 50%;
  }

  .number-input:focus {
    outline: none;
    border: 1px solid #dedede;
    box-shadow: 0 0 10px #f00;
    border-radius: 10px;
  }
`;

export const ColumnInputStyle = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  align-items: flex-start;
  margin-bottom: 12px;
  width: 100%;

  .property-name {
    margin-bottom: 4px;
    font-size: 14px;
    font-weight: 500;
  }
`;
