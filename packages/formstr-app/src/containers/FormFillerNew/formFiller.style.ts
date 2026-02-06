import styled from "styled-components";
import { MEDIA_QUERY_MOBILE } from "../../utils/css";
export default styled.div<{
  $isPreview?: boolean;
  $bgImage?: string;
  $titleImageUrl?: string;
}>`
  .form-filler {
    position: relative;
    background-color: transparent;
    padding-left: 32px;
    padding-right: 32px;
    width: 60%;
    margin: 0 auto 0 auto;
    ${MEDIA_QUERY_MOBILE} {
      width: 100%;
      padding: 0;
    }
  }

  .filler-container {
    width: 100%;
    ${({ $bgImage }) =>
    $bgImage
      ? `
          background-image: url(${$bgImage});
          background-repeat: repeat;        /* allow tiling if small */
          background-position: center top;  /* anchor it nicely */
          background-size: auto;
        `
      : `
          background-color: #dedede;
        `}

    position: relative;
    min-height: 100dvh;
    display: flex;
    flex-direction: column;

    justify-content: flex-start;
    
    .branding-container {
      margin-top: auto;
    }
  }

  .branding-container {
    display: flex;
    justify-content: space-between;
    padding-top: 10px;
    margin-left: 20px;
    margin-right: 20px;
    margin-bottom: 10px;
    ${MEDIA_QUERY_MOBILE} {
      flex-direction: column;
      align-items: center;
    }
  }

  .text-style {
    color: #a8a29e;
    font-size: 14;
  }

  .form-title {
    position: relative;
    margin-top: 30px;
    border-radius: 10px;
    overflow: hidden;

    ${({ $titleImageUrl }) =>
    $titleImageUrl
      ? `
        height: 250px;
        background-color: #ff5733; /* or use gradient/image from FormBanner */
      `
      : `
        height: auto;
        background-color: transparent;
        border-radius: 0;
        margin-top: 16px;
      `}
  }

  .filler-question {
    max-width: "100%";
    margin: "5px";
    text-align: "left";
  }

  .form-description {
    text-align: left;
    padding: 1em;
  }

  .submit-button {
    display: flex;
    justify-content: flex-end;
    align-items: flex-end;
  }
  .validate-button {
    display: flex;
    justify-content: flex-end;
    align-items: flex-end;
    background: #009933;
  }

  .foss-link {
    text-decoration: none;
  }

  .with-description {
    margin-top: 1px;
  }

  .hidden-description {
    margin-top: 10px;
  }

  .embed-submitted {
    height: 100dvh;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
  }

  .question-text {
    img {
      max-width: 40%;
      height: auto;
    }
    word-wrap: break-word;
    overflow: auto;
    height: auto;
  }

  /* Section-specific styles */
  .section-progress {
    margin-bottom: 24px;

    .ant-progress-bg {
      background: linear-gradient(90deg, #ff6b00 0%, #ff2e00 100%);
    }
  }

  .section-steps {
    margin-bottom: 32px;

    .ant-steps-item-process .ant-steps-item-icon {
      background-color: #ff5733;
      border-color: #ff5733;
    }

    .ant-steps-item-finish .ant-steps-item-icon {
      background-color: #52c41a;
      border-color: #52c41a;
    }

    .ant-steps-item-title {
      font-weight: 500;
    }

    .ant-steps-item {
      cursor: pointer;
    }

    .ant-steps-item:hover .ant-steps-item-title {
      color: #ff5733;
    }

    ${MEDIA_QUERY_MOBILE} {
      .ant-steps-item-description {
        display: none;
      }
    }
  }

  .section-header {
    margin-bottom: 24px;
    background: white;
    border-radius: 8px;
    padding: 20px;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);

    .ant-typography {
      margin: 0;
    }

    h4 {
      color: #1f2937;
      margin-bottom: 8px;
    }
  }

  .section-navigation {
    margin-top: 24px;
    display: flex;
    justify-content: space-between;
    align-items: center;

    .ant-btn-primary {
      background: linear-gradient(180deg, #ff6b00 0%, #ff2e00 60.92%);
      border: none;

      &:hover {
        opacity: 0.8;
      }
    }

    ${MEDIA_QUERY_MOBILE} {
      flex-direction: column;
      gap: 12px;

      .ant-btn {
        width: 100%;
      }
    }
  }

  .section-content {
    min-height: 300px;

    .ant-card {
      margin-bottom: 16px;
      border-radius: 8px;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    }
  }

  /* Progress indicator styles */
  .progress-container {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 16px;

    .ant-progress {
      flex: 1;
    }

    .progress-text {
      white-space: nowrap;
      font-size: 12px;
      color: #6b7280;
    }
  }

  /* Responsive adjustments for sections */
  ${MEDIA_QUERY_MOBILE} {
    .section-steps.ant-steps-vertical {
      .ant-steps-item-content {
        min-height: auto;
      }

      .ant-steps-item-description {
        margin-top: 4px;
      }
    }

    .section-header {
      padding: 16px;
      margin-bottom: 16px;
    }
  }
`;
