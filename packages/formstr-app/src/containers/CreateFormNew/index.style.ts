import styled from "styled-components";
import { MEDIA_QUERY_MOBILE } from "../../utils/css";

export default styled.div<{
  $isOpen?: boolean;
  $isRightSettingsOpen?: boolean;
}>`
  /* The row owns the height; panes are height:100% of it. Any browser that
     mishandles viewport units on a pane can no longer skew the layout —
     worst case all three collapse *uniformly* to content height. */
  .builder-row {
    display: flex;
    max-width: 100vw;
    height: calc(100vh - 64px);
    height: calc(100dvh - 64px);
  }
  .builder-row > * {
    min-height: 0;
  }

  .left-sidebar {
    overflow: wrap;
    background-color: white;
    ${MEDIA_QUERY_MOBILE} {
      display: ${(props) => (props.$isOpen ? "block" : "none")};
      box-shadow: 3px 1px 5px -3px gray;
    }
  }

  .main-content {
    ${MEDIA_QUERY_MOBILE} {
      width: 100%;
      padding: 0;
      position: ${(props) => (props.$isOpen ? "absolute" : "static")};
      z-index: ${(props) => (props.$isOpen ? "-1" : "0")};
      opacity: ${(props) =>
        props.$isOpen || props.$isRightSettingsOpen ? "0.5" : "1"};
    }
  }

  .right-sidebar {
    ${MEDIA_QUERY_MOBILE} {
      display: ${(props) => (props.$isRightSettingsOpen ? "block" : "none")};
      box-shadow: 2px 4px 5px 3px gray;
      position: ${(props) =>
        props.$isRightSettingsOpen ? "absolute" : "static"};
      right: 0;
      background: white;
      overflow: scroll;
    }
  }

  .form-filler {
    width: 70%;
    margin: 0 auto 0 auto;
  }
`;
