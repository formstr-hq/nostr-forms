import styled from "styled-components";

export default styled.div`
  .export-excel {
    display: flex;
    justify-content: flex-end;
    margin: 10px;
    max-height: 5%;
    padding: 15px;
  }

  // Limit media sizes in table cells to prevent overflow
  .ant-table-thead > tr > th,
  .ant-table-tbody > tr > td {
    img {
      max-width: 100%;
      max-height: 200px;
      object-fit: contain;
    }
    audio, video {
      max-width: 100%;
      max-height: 200px;
    }
  }
`;
