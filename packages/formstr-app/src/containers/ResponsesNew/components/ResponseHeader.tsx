// packages/formstr-app/src/containers/ResponsesNew/components/ResponseHeader.tsx
import React from "react";
import { Box, Button } from "@mui/material";
import SmartToyOutlinedIcon from "@mui/icons-material/SmartToyOutlined";
import { Export } from "../Export";

interface ResponseHeaderProps {
  hasResponses: boolean;
  onAiAnalysisClick: () => void;
  responsesData: Array<{ [key: string]: string }>;
  formName: string;
}

export const ResponseHeader: React.FC<ResponseHeaderProps> = ({
  hasResponses,
  onAiAnalysisClick,
  responsesData,
  formName,
}) => {
  return (
    <Box
      sx={{
        display: "flex",
        justifyContent: "flex-end",
        gap: 1,
        px: 2,
        py: 1,
      }}
    >
      <Button
        variant="outlined"
        startIcon={<SmartToyOutlinedIcon />}
        disabled={!hasResponses}
        onClick={onAiAnalysisClick}
      >
        AI Analysis
      </Button>
      <Export responsesData={responsesData} formName={formName} />
    </Box>
  );
};
