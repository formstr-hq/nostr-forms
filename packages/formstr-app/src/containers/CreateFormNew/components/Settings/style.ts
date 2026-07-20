import styled from "styled-components";

export default styled.div`
  /* vh fallback first — see QuestionsList/style.ts note. */
  height: calc(100vh - 64px);
  height: calc(100dvh - 64px);
  overflow: auto;
  background-color: white;
  width: 242px;
  min-width: 242px;
`;
