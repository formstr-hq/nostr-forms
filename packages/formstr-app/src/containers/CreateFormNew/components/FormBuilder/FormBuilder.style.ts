import styled from "styled-components";

export default styled.div`
  .builder-wrapper {
    min-width: 60%;
    background-color: var(--app-color-bg-canvas);
    padding-left: 2rem;
    padding-right: 2rem;
    overflow: scroll;
    height: -webkit-calc(100vh - 85px); /* google, safari */
  }
`;
