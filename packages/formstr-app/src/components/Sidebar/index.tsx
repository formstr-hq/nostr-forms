import { forwardRef } from "react";
import { Box } from "@mui/material";

/**
 * MUI replacement for the antd Layout.Sider wrapper (ui-rewrite-mui).
 * Height comes from .builder-row — percentage, not viewport units; the menu
 * scrolls inside the pane.
 */
function Sidebar(
  {
    className,
    width,
    children,
  }: {
    className?: string;
    width: number;
    children: React.ReactNode;
  },
  ref: any,
) {
  return (
    <Box
      ref={ref}
      className={className}
      sx={{
        height: "100%",
        overflow: "hidden",
        "& .menu-divider": { m: 0 },
      }}
    >
      <Box
        className="create-sidebar"
        sx={{
          width,
          height: "100%",
          borderRight: 1,
          borderColor: "divider",
          mt: "1px",
          bgcolor: "background.paper",
          overflowY: "auto",
          overflowX: "hidden",
        }}
      >
        {children}
      </Box>
    </Box>
  );
}

export default forwardRef(Sidebar);
