import styled from "styled-components";
import { Card } from "antd";

export const SectionWrapper = styled.div`
  margin-bottom: 24px;
  .section-header {
    margin-bottom: 16px;
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
  }
  .section-title {
    font-size: 18px;
    font-weight: 500;
    width: 100%;
    margin-bottom: 8px;
  }
  .section-title-input {
    font-size: 18px;
    font-weight: 500;
    margin-bottom: 8px;
  }
  .section-description {
    color: var(--app-color-text-secondary);
    width: 100%;
  }
  .section-content {
    margin-top: 16px;
  }
  .section-actions {
    display: flex;
    gap: 8px;
    margin-left: 16px;
  }
  .collapsed-indicator {
    margin-left: 8px;
    color: var(--app-color-text-muted);
  }
  .drop-indicator {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: rgba(24, 144, 255, 0.1);
    border: 2px dashed var(--app-color-info);
    border-radius: 4px;
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 5;
    pointer-events: none;
  }
`;

export const CardContainer = styled.div`
  position: relative;
  transition: all 0.2s;
  border-radius: 8px 8px 8px 8px;
  margin-top: -6px;
  z-index: 0;
  background-color: rgba(255, 255, 255, 0.4);
  
  .ant-card {
    border: none;
    background-color: transparent;
    box-shadow: none;
  }
`;

export const StyledCard = styled(Card)`
  .ant-card-head {
    border-bottom: none;
    background-color: transparent;
  }
  
  .ant-card-body {
    padding-top: 16px;
    background-color: transparent;
  }
`;

export const OrangeStrip = styled.div`
  height: 12px;
  background: var(--app-color-primary);
  margin-bottom: 0;
  border-radius: 0 9px 0px 0px;
  z-index: 1;
  position: relative;
`;

export const SectionLabel = styled.div`
  background: var(--app-color-primary);
  color: white;
  padding: 2px 16px;
  border-radius: 6px 6px 0 0;
  font-size: 14px;
  font-weight: 500;
  margin-bottom: 0;
  display: inline-block;
  margin-left: 0;
  position: relative;
  z-index: 2;
`;
