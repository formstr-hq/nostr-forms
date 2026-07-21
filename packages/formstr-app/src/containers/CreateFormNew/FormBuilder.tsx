import Sidebar from "./components/Sidebar";
import { QuestionsList } from "./components/QuestionsList";
import Settings from "./components/Settings";
import { Box, Drawer, useMediaQuery } from "@mui/material";
import { useRef } from "react";
import { useOutsideClickHandler } from "./hooks/useOutsideClickHandler";
import useFormBuilderContext from "./hooks/useFormBuilderContext";

const BUILDER_HEIGHT = {
  height: "calc(100vh - 64px)",
  "@supports (height: 100dvh)": { height: "calc(100dvh - 64px)" },
} as const;

/**
 * Bottom-sheet chrome for the mobile palette/settings drawers. The sheet
 * fills the width and forces the desktop panes (fixed-width side rails) to
 * flow full-width and content-height inside it — see
 * docs/ui-rewrite/design-direction.md §3 ("palette becomes a FAB sheet",
 * settings become a bottom sheet).
 */
const sheetPaperSx = {
  left: 0,
  right: 0,
  width: "100%",
  maxWidth: "100%",
  boxSizing: "border-box",
  borderTopLeftRadius: 16,
  borderTopRightRadius: 16,
  maxHeight: "85dvh",
  overflowY: "auto",
  overflowX: "hidden",
  // Neutralise the desktop side-rail sizing when reused inside the sheet so
  // the content flows full-width and content-height instead of a fixed rail.
  "& .create-sidebar": {
    width: "100% !important",
    height: "auto",
    borderRight: "none",
  },
  "& .left-sidebar": { height: "auto", overflow: "visible", width: "100%" },
  "& .right-sidebar": {
    width: "100% !important",
    minWidth: "0 !important",
    height: "auto",
  },
} as const;

const SheetHandle = () => (
  <Box
    sx={{
      width: 40,
      height: 4,
      borderRadius: 2,
      bgcolor: "divider",
      mx: "auto",
      mt: 1,
      mb: 0.5,
      flexShrink: 0,
    }}
  />
);

/**
 * Builder shell (MUI, ui-rewrite-mui). Desktop keeps the 3-pane row; mobile
 * collapses to a single scrolling canvas with the field palette and the
 * question/form settings presented as bottom sheets.
 */
function FormBuilder() {
  const isMobile = useMediaQuery("(max-width:768px)", { noSsr: true });
  const leftSidebarRef = useRef<HTMLInputElement>(null);
  const rightSidebarRef = useRef<HTMLInputElement>(null);

  const {
    isRightSettingsOpen,
    isLeftMenuOpen,
    setIsLeftMenuOpen,
    toggleSettingsWindow,
    closeSettingsOnOutsideClick,
    closeMenuOnOutsideClick,
  } = useFormBuilderContext();

  useOutsideClickHandler(leftSidebarRef, closeMenuOnOutsideClick);
  useOutsideClickHandler(rightSidebarRef, closeSettingsOnOutsideClick);

  if (isMobile) {
    return (
      <Box sx={BUILDER_HEIGHT}>
        <QuestionsList />

        <Drawer
          anchor="bottom"
          open={isLeftMenuOpen}
          onClose={() => setIsLeftMenuOpen(false)}
          slotProps={{ paper: { sx: sheetPaperSx } }}
        >
          <SheetHandle />
          <Sidebar />
        </Drawer>

        <Drawer
          anchor="bottom"
          open={isRightSettingsOpen}
          onClose={() => isRightSettingsOpen && toggleSettingsWindow()}
          slotProps={{ paper: { sx: sheetPaperSx } }}
        >
          <SheetHandle />
          <Settings />
        </Drawer>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        ".builder-row": {
          display: "flex",
          maxWidth: "100vw",
          ...BUILDER_HEIGHT,
        },
        ".builder-row > *": { minHeight: 0 },
        ".left-sidebar": { backgroundColor: "white" },
        ".form-filler": { width: "70%", margin: "0 auto 0 auto" },
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
