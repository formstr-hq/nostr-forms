import Sidebar from "./components/Sidebar";
import { QuestionsList } from "./components/QuestionsList";
import Settings from "./components/Settings";
import { Box } from "@mui/material";
import { useRef } from "react";
import { useOutsideClickHandler } from "./hooks/useOutsideClickHandler";
import useFormBuilderContext from "./hooks/useFormBuilderContext";
import { MEDIA_QUERY_MOBILE } from "../../utils/css";

/**
 * Builder 3-pane row (MUI, ui-rewrite-mui Phase 5). The row owns the height;
 * panes are height:100% of it. Desktop layout is unchanged — the uplift is
 * styling-level per docs/ui-rewrite/design-direction.md.
 */
function FormBuilder() {
  const leftSidebarRef = useRef<HTMLInputElement>(null);
  const rightSidebarRef = useRef<HTMLInputElement>(null);

  const {
    isRightSettingsOpen,
    isLeftMenuOpen,
    closeSettingsOnOutsideClick,
    closeMenuOnOutsideClick,
  } = useFormBuilderContext();

  useOutsideClickHandler(leftSidebarRef, closeMenuOnOutsideClick);
  useOutsideClickHandler(rightSidebarRef, closeSettingsOnOutsideClick);

  return (
    <Box
      sx={{
        ".builder-row": {
          display: "flex",
          maxWidth: "100vw",
          // The row owns the height; dvh wins where supported, vh fallback.
          height: "calc(100vh - 64px)",
          "@supports (height: 100dvh)": {
            height: "calc(100dvh - 64px)",
          },
        },
        ".builder-row > *": { minHeight: 0 },
        ".left-sidebar": {
          backgroundColor: "white",
          [MEDIA_QUERY_MOBILE]: {
            display: isLeftMenuOpen ? "block" : "none",
            boxShadow: "3px 1px 5px -3px gray",
          },
        },
        ".main-content": {
          [MEDIA_QUERY_MOBILE]: {
            width: "100%",
            padding: 0,
            position: isLeftMenuOpen ? "absolute" : "static",
            zIndex: isLeftMenuOpen ? -1 : 0,
            opacity: isLeftMenuOpen || isRightSettingsOpen ? 0.5 : 1,
          },
        },
        ".right-sidebar": {
          [MEDIA_QUERY_MOBILE]: {
            display: isRightSettingsOpen ? "block" : "none",
            boxShadow: "2px 4px 5px 3px gray",
            position: isRightSettingsOpen ? "absolute" : "static",
            right: 0,
            background: "white",
            overflow: "scroll",
          },
        },
        ".form-filler": {
          width: "70%",
          margin: "0 auto 0 auto",
        },
      }}
    >
      <div className="builder-row">
        <Sidebar ref={leftSidebarRef} />
        <QuestionsList />
        <Settings ref={rightSidebarRef} />
      </div>
    </Box>
  );
}

export default FormBuilder;
