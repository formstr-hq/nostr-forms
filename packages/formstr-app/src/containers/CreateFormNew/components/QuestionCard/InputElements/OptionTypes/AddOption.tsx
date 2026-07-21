import AddIcon from "@mui/icons-material/Add";
import { Box, Button, Typography } from "@mui/material";
import { makeTag } from "../../../../../../utils/utility";
import { addOption } from "./utils";
import { Choice } from "./types";
import UploadFile from "../../UploadFile";

interface AddOptionProps {
  choices: Array<Choice>;
  displayOther: boolean;
  disable: boolean;
  callback: (choices: Array<Choice>) => void;
}
export const AddOption: React.FC<AddOptionProps> = ({
  displayOther,
  disable,
  choices,
  callback,
}) => {
  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "row",
        justifyContent: "flex-start",
        alignItems: "center",
        m: "2px",
      }}
    >
      <Button
        disabled={disable}
        variant="outlined"
        onClick={() => {
          addOption([makeTag(6), "Add option"], choices, callback);
        }}
        startIcon={<AddIcon />}
        sx={{ borderStyle: "dashed" }}
      >
        Add Option
      </Button>
      <UploadFile
        onImageUpload={(markdownUrl) => {
          addOption([makeTag(6), markdownUrl], choices, callback);
        }}
      />
      {displayOther && (
        <>
          <Box sx={{ m: "5px" }}>
            <Typography
              component="span"
              color={disable ? "text.disabled" : "text.primary"}
            >
              {" or "}
            </Typography>
          </Box>
          <Button
            variant="outlined"
            disabled={disable}
            onClick={() => {
              addOption(
                [makeTag(6), "Other", JSON.stringify({ isOther: true })],
                choices,
                callback,
              );
            }}
            sx={{ borderStyle: "dashed" }}
          >
            add other
          </Button>
        </>
      )}
    </Box>
  );
};
