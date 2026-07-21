import {
  ListItemIcon,
  ListItemText,
  ListSubheader,
  MenuItem,
  MenuList as MuiMenuList,
} from "@mui/material";

export interface BuilderMenuItem {
  key: string;
  label: string;
  icon: React.ReactNode;
  primitive?: string;
  answerSettings?: object;
}

/**
 * MUI replacement for the antd Menu used by the builder's left-sidebar menus
 * (ui-rewrite-mui Phase 5): flat action menu (menuitem roles, like antd's)
 * with an optional group subheader.
 */
export const MenuList = ({
  items,
  subheader,
  onSelect,
}: {
  items: BuilderMenuItem[];
  subheader?: string;
  onSelect: (key: string) => void;
}) => {
  return (
    <>
      {subheader && <ListSubheader disableSticky>{subheader}</ListSubheader>}
      <MuiMenuList dense sx={{ width: "100%" }}>
        {items.map((item) => (
          <MenuItem
            key={item.key}
            onClick={() => onSelect(item.key)}
            sx={{
              borderRadius: 1,
              mx: 0.5,
              whiteSpace: "normal",
              width: "auto",
            }}
          >
            <ListItemIcon sx={{ minWidth: 32 }}>{item.icon}</ListItemIcon>
            <ListItemText
              primary={item.label}
              slotProps={{
                primary: {
                  sx: {
                    fontSize: 14,
                    wordBreak: "break-word",
                    whiteSpace: "normal",
                  },
                },
              }}
            />
          </MenuItem>
        ))}
      </MuiMenuList>
    </>
  );
};
