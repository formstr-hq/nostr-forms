import style from "styled-components";

export default style.div`
  display: flex;
  flex-direction: column;
  align-items: center;

  .public-forms-list {
    display: flex;
    flex-direction: column;
    align-items: stretch;
    width: 100%;
    max-width: 760px;
    gap: 16px;
    margin-top: 16px;
  }
`;
