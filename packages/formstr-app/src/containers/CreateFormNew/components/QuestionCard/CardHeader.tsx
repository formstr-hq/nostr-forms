import React from "react";
import { Box, IconButton } from "@mui/material";
import ArrowUpwardIcon from "@mui/icons-material/ArrowUpward";
import ArrowDownwardIcon from "@mui/icons-material/ArrowDownward";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import { ReactComponent as Asterisk } from "../../../../Images/asterisk.svg";
import useFormBuilderContext from "../../hooks/useFormBuilderContext";
import useDeviceType from "../../../../hooks/useDeviceType";
import { classNames } from "../../../../utils/utility";
import DeleteButton from "./DeleteButton";
import { Field } from "../../../../nostr/types";

interface CardHeaderProps {
  required?: boolean;
  onRequired: (required: boolean) => void;
  question: Field;
  onReorderKey: (keyType: "UP" | "DOWN", tempId: string) => void;
  firstQuestion: boolean;
  lastQuestion: boolean;
}

const actionIconSx = {
  height: 28,
  width: 28,
  bgcolor: "rgba(0, 0, 0, 0.05)",
  borderRadius: "50%",
  mr: 1,
} as const;

const CardHeader: React.FC<CardHeaderProps> = ({
  required,
  onRequired,
  onReorderKey,
  question,
  firstQuestion,
  lastQuestion,
}) => {
  const { MOBILE } = useDeviceType();
  const { toggleSettingsWindow, deleteQuestion, setQuestionIdInFocus } =
    useFormBuilderContext();

  return (
    <Box
      sx={{
        display: "flex",
        justifyContent: "space-between",
        pb: "10px",
        pt: "5px",
        ".asterisk": {
          transition: "fill 0.2s ease-in-out",
          fontSize: 12,
          m: "2.5px",
          height: 12,
          width: 12,
        },
        ".asterisk:hover": { fill: "#ea8dea" },
        ".asteriskSelected": { fill: "#ea8dea" },
      }}
    >
      <Box sx={{ display: "flex" }}>
        {!firstQuestion && (
          <IconButton
            aria-label="move question up"
            size="small"
            sx={actionIconSx}
            onMouseDown={(e) => {
              e.preventDefault();
              onReorderKey("UP", question[1]);
            }}
          >
            <ArrowUpwardIcon sx={{ fontSize: 14 }} />
          </IconButton>
        )}
        {!lastQuestion && (
          <IconButton
            aria-label="move question down"
            size="small"
            sx={actionIconSx}
            onMouseDown={(e) => {
              e.preventDefault();
              onReorderKey("DOWN", question[1]);
            }}
          >
            <ArrowDownwardIcon sx={{ fontSize: 14 }} />
          </IconButton>
        )}
        <IconButton
          aria-label="toggle required"
          size="small"
          sx={actionIconSx}
          onClick={() => {
            onRequired(!required);
          }}
        >
          <Asterisk
            className={classNames("asterisk", { asteriskSelected: required })}
          />
        </IconButton>
        <DeleteButton
          onDelete={() => {
            deleteQuestion(question[1]);
            setQuestionIdInFocus(undefined);
          }}
        />
      </Box>

      {MOBILE && (
        <IconButton
          aria-label="question settings"
          size="small"
          sx={actionIconSx}
          onClick={toggleSettingsWindow}
        >
          <MoreVertIcon sx={{ fontSize: 16 }} />
        </IconButton>
      )}
    </Box>
  );
};

export default CardHeader;
