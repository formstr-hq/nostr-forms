import styled from "styled-components";
import { MEDIA_QUERY_MOBILE } from "../../utils/css";

export default styled.div`
  --responses-top-offset: 76px;
  --responses-side-gap: 12px;

  .responses-layout {
    display: flex;
    align-items: flex-start;
    gap: 16px;
    min-height: calc(100vh - var(--responses-top-offset) - var(--responses-side-gap));
  }

  .responses-main-panel {
    flex: 1;
    min-width: 0;
  }

  .responses-main-panel::-webkit-scrollbar,
  .responses-chat-panel::-webkit-scrollbar {
    width: 5px;
    height: 5px;
  }

  .responses-main-panel::-webkit-scrollbar-track,
  .responses-chat-panel::-webkit-scrollbar-track {
    background: transparent;
  }

  .responses-main-panel::-webkit-scrollbar-thumb,
  .responses-chat-panel::-webkit-scrollbar-thumb {
    background: rgba(120, 120, 120, 0.4);
    border-radius: 999px;
  }

  .responses-main-panel::-webkit-scrollbar-thumb:hover,
  .responses-chat-panel::-webkit-scrollbar-thumb:hover {
    background: rgba(120, 120, 120, 0.6);
  }

  .responses-main-panel,
  .responses-chat-panel {
    scrollbar-width: thin;
    scrollbar-color: rgba(120, 120, 120, 0.5) transparent;
  }

  .responses-chat-panel {
    width: min(420px, 35vw);
    min-width: 320px;
    height: calc(100vh - var(--responses-top-offset) - var(--responses-side-gap));
    position: sticky;
    top: var(--responses-top-offset);
    overflow: hidden;
  }

  .export-excel {
    display: flex;
    justify-content: flex-end;
    margin: 10px;
    max-height: 5%;
    padding: 15px;
  }

  ${MEDIA_QUERY_MOBILE} {
    .responses-layout {
      display: block;
      min-height: auto;
    }

    .responses-chat-panel {
      width: 100%;
      min-width: 0;
      height: auto;
      max-height: none;
      position: static;
      margin-top: 12px;
    }
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
