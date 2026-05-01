import styled from "styled-components";
import { MEDIA_QUERY_MOBILE } from "../../utils/css";

export default styled.div`
  margin: 10px;

  .summary-container {
    display: flex;
    justify-content: center;
  }

  .ant-card {
    width: 60%;
    ${MEDIA_QUERY_MOBILE} {
      width: 100%;
    }
  }
  .heading {
    font-size: 24px;
  }

  .response-count-container {
    display: flex;
    flex-direction: column;
  }

  .response-count {
    font-size: 24px;
  }

  .response-count-label {
    font-size: 14px;
    color: "#78716C";
  }
`;
