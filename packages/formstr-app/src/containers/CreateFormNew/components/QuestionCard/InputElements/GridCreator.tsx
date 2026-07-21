import AddIcon from "@mui/icons-material/Add";
import CloseIcon from "@mui/icons-material/Close";
import {
  Box,
  Button,
  Checkbox,
  IconButton,
  Radio,
  TextField,
} from "@mui/material";
import { useState, useEffect } from "react";
import { GridOptions } from "../../../../../nostr/types";
import { makeTag } from "../../../../../utils/utility";
import { useTranslation } from "react-i18next";

interface GridCreatorProps {
  initialValue?: GridOptions;
  onValuesChange: (options: GridOptions) => void;
  allowMultiple: boolean;
}

type GridItem = [id: string, label: string, config?: string];

const cellInputSx = {
  width: "100%",
  background: "transparent",
  textAlign: "inherit",
  p: 0,
  "&.Mui-focused": {
    outline: "2px solid",
    outlineColor: "primary.main",
    outlineOffset: "-2px",
    background: "#fff",
  },
} as const;

const deleteBtnSx = {
  position: "absolute",
  right: 2,
  top: "50%",
  transform: "translateY(-50%)",
  color: "text.disabled",
  p: "2px",
  "&:hover": {
    color: "error.main",
  },
} as const;

export const GridCreator: React.FC<GridCreatorProps> = ({
  initialValue,
  onValuesChange,
  allowMultiple,
}) => {
  const { t } = useTranslation();
  const [columns, setColumns] = useState<GridItem[]>(() => {
    if (
      initialValue?.columns &&
      Array.isArray(initialValue.columns) &&
      initialValue.columns.length > 0
    ) {
      return initialValue.columns;
    }
    return [
      [makeTag(6), t("builder.grid.defaultColumn", { number: 1 }), "{}"],
      [makeTag(6), t("builder.grid.defaultColumn", { number: 2 }), "{}"],
    ];
  });

  const [rows, setRows] = useState<GridItem[]>(() => {
    if (
      initialValue?.rows &&
      Array.isArray(initialValue.rows) &&
      initialValue.rows.length > 0
    ) {
      return initialValue.rows;
    }
    return [
      [makeTag(6), t("builder.grid.defaultRow", { number: 1 }), "{}"],
      [makeTag(6), t("builder.grid.defaultRow", { number: 2 }), "{}"],
    ];
  });

  useEffect(() => {
    onValuesChange({ columns, rows });
  }, [columns, rows]);

  const handleColumnLabelChange = (id: string, label: string) => {
    setColumns(
      columns.map((col) =>
        col[0] === id ? [col[0], label, col[2] || "{}"] : col,
      ),
    );
  };

  const handleColumnAdd = () => {
    if (columns.length >= 10) return;
    const newColumn: GridItem = [
      makeTag(6),
      t("builder.grid.defaultColumn", { number: columns.length + 1 }),
      "{}",
    ];
    setColumns([...columns, newColumn]);
  };

  const handleColumnDelete = (id: string) => {
    if (columns.length <= 1) return;
    setColumns(columns.filter((col) => col[0] !== id));
  };

  const handleRowLabelChange = (id: string, label: string) => {
    setRows(
      rows.map((row) =>
        row[0] === id ? [row[0], label, row[2] || "{}"] : row,
      ),
    );
  };

  const handleRowAdd = () => {
    if (rows.length >= 10) return;
    const newRow: GridItem = [
      makeTag(6),
      t("builder.grid.defaultRow", { number: rows.length + 1 }),
      "{}",
    ];
    setRows([...rows, newRow]);
  };

  const handleRowDelete = (id: string) => {
    if (rows.length <= 1) return;
    setRows(rows.filter((row) => row[0] !== id));
  };

  return (
    <Box>
      <Box sx={{ width: "100%", overflowX: "auto", mt: 1 }}>
        <Box
          component="table"
          sx={{
            width: "100%",
            borderCollapse: "collapse",
            minWidth: 400,
            "& th, & td": {
              padding: "8px",
              textAlign: "center",
              border: "1px solid",
              borderColor: "divider",
              position: "relative",
            },
            "& th:first-of-type, & td:first-of-type": {
              textAlign: "left",
              fontWeight: 500,
              minWidth: 150,
              background: "#fafafa",
            },
            "& thead th": {
              background: "#f5f5f5",
              fontWeight: 600,
            },
            "& tbody tr:hover": {
              background: "#fafafa",
            },
          }}
        >
          <thead>
            <tr>
              <th></th>
              {columns.map((col) => (
                <th key={col[0]}>
                  <TextField
                    variant="standard"
                    value={col[1]}
                    onChange={(e) =>
                      handleColumnLabelChange(col[0], e.target.value)
                    }
                    placeholder={t("builder.grid.columnPlaceholder")}
                    slotProps={{
                      input: {
                        disableUnderline: true,
                        sx: { ...cellInputSx, fontWeight: 600 },
                      },
                      htmlInput: {
                        style: { textAlign: "center" },
                      },
                    }}
                    fullWidth
                  />
                  {columns.length > 1 && (
                    <IconButton
                      size="small"
                      sx={deleteBtnSx}
                      onClick={() => handleColumnDelete(col[0])}
                    >
                      <CloseIcon sx={{ fontSize: 14 }} />
                    </IconButton>
                  )}
                </th>
              ))}
              {columns.length < 10 && (
                <Box
                  component="th"
                  onClick={handleColumnAdd}
                  sx={{
                    background: "#fafafa",
                    cursor: "pointer",
                    color: "#ff4d4f",
                    "&:hover": {
                      background: "#e6f7ff",
                    },
                  }}
                >
                  <AddIcon sx={{ fontSize: 14, verticalAlign: "middle" }} />{" "}
                  {t("builder.grid.addColumn")}
                </Box>
              )}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row[0]}>
                <td>
                  <TextField
                    variant="standard"
                    value={row[1]}
                    onChange={(e) =>
                      handleRowLabelChange(row[0], e.target.value)
                    }
                    placeholder={t("builder.grid.rowPlaceholder")}
                    slotProps={{
                      input: {
                        disableUnderline: true,
                        sx: cellInputSx,
                      },
                    }}
                    fullWidth
                  />
                  {rows.length > 1 && (
                    <IconButton
                      size="small"
                      sx={deleteBtnSx}
                      onClick={() => handleRowDelete(row[0])}
                    >
                      <CloseIcon sx={{ fontSize: 14 }} />
                    </IconButton>
                  )}
                </td>
                {columns.map((col) => (
                  <td key={col[0]}>
                    {allowMultiple ? (
                      <Checkbox disabled size="small" />
                    ) : (
                      <Radio disabled size="small" />
                    )}
                  </td>
                ))}
                {columns.length < 10 && <td></td>}
              </tr>
            ))}
          </tbody>
        </Box>
      </Box>
      {rows.length < 10 && (
        <Button
          variant="outlined"
          onClick={handleRowAdd}
          startIcon={<AddIcon />}
          sx={{ mt: 1, width: "100%", borderStyle: "dashed" }}
        >
          {t("builder.grid.addRow")}
        </Button>
      )}
    </Box>
  );
};
