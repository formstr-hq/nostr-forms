import { InputNumber, Typography, Space } from "antd";
import React from "react";
import { IAnswerSettings } from "../types";

const { Text } = Typography;

interface RatingSettingsProps {
  answerSettings: IAnswerSettings;
  handleAnswerSettings: (settings: IAnswerSettings) => void;
}

export const RatingSettings: React.FC<RatingSettingsProps> = ({
  answerSettings,
  handleAnswerSettings,
}) => {
  const maxStars = (answerSettings.maxStars as number | undefined) || 5;

  const updateMaxStars = (value: number | null) => {
    handleAnswerSettings({
      ...answerSettings,
      maxStars: value || 5,
    });
  };

  return (
    <Space direction="vertical" style={{ width: "100%" }}>
      <div className="property-setting">
        <Text className="property-name">Max Stars</Text>
        <InputNumber
          min={3}
          max={10}
          value={maxStars}
          onChange={updateMaxStars}
        />
      </div>
    </Space>
  );
};