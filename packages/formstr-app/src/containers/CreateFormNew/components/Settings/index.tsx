import useFormBuilderContext from "../../hooks/useFormBuilderContext";
import FormSettings from "../FormSettings";
import AnswerSettings from "../AnswerSettings";
import { Box } from "@mui/material";
import { forwardRef } from "react";

// TODO: remove usage of any here
function Settings(_props: any, ref: any) {
  const { questionIdInFocus } = useFormBuilderContext();

  return (
    <Box
      ref={ref}
      className="right-sidebar"
      sx={{
        // Height comes from .builder-row — percentage, not viewport units.
        height: "100%",
        overflow: "auto",
        bgcolor: "background.paper",
        width: 242,
        minWidth: 242,
      }}
    >
      {questionIdInFocus ? <AnswerSettings /> : <FormSettings />}
    </Box>
  );
}

export default forwardRef(Settings);
