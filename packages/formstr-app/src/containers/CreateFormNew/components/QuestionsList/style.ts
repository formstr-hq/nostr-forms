import styled from "styled-components";
import { MEDIA_QUERY_MOBILE } from "../../../../utils/css";

export default styled.div<{
  $bgImage?: string;
  $titleImageUrl?: string
}>`
  background-color: var(--app-color-bg-canvas);
  background-image: ${(props) =>
    props.$bgImage ? `url(${props.$bgImage})` : "none"};
  background-repeat: repeat;
  background-position: center top;
  background-size: auto;
  padding-left: 32px;
  padding-right: 32px;
  overflow: scroll;
  height: calc(100dvh - 67px);
  width: calc(100vw - 482px);

    .form-title {
    position: relative;
    margin-top: 30px;
    border-radius: 10px;
    overflow: hidden;

    ${({ $titleImageUrl }) =>
      $titleImageUrl
        ? `
        height: 250px;
        background-color: var(--app-color-primary); /* or use gradient/image from FormBanner */
      `
        : `
        height: auto;
        background-color: transparent;
        border-radius: 0;
        margin-top: 16px;
      `}
  }

  .form-description {
    text-align: left;
    padding: 1em;
  }

  .mobile-add-btn {
    display: none;
    ${MEDIA_QUERY_MOBILE} {
      display: block;
      position: fixed;
      right: 10px;
      bottom: 80px;
      margin: 10px;
      z-index: 1000;

      > div {
        width: 53px;
        height: 50px;
        > div > button {
          width: 100%;
          height: 100%;
          padding: 0;
          display: flex;
          align-items: center;
          justify-content: center;
        }
      }
    }
  }

  .reorder-group {
    list-style: none;
    padding: 0;
  }
`;
