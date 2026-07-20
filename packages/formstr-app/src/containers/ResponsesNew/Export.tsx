import React, { useState } from "react";
import { Button, Menu, MenuItem } from "@mui/material";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import { useTranslation } from "react-i18next";

export const Export: React.FC<{
  responsesData: Array<{ [key: string]: string }>;
  formName: string;
}> = ({ responsesData, formName }) => {
  const { t } = useTranslation();
  const [menuAnchor, setMenuAnchor] = useState<HTMLElement | null>(null);
  const hasResponses = responsesData.length > 0;

  const onDownloadClick = async (type: "csv" | "excel") => {
    if (!hasResponses) {
      alert(t("responses.export.noResponses"));
      return;
    }

    try {
      const XLSX = await import("xlsx");
      const SheetName =
        t("responses.export.sheetName", { formName }).substring(0, 16) + "...";
      const workSheet = XLSX.utils.json_to_sheet(responsesData);
      const workBook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workBook, workSheet, `${SheetName}`);

      const fileExtension = type === "excel" ? ".xlsx" : ".csv";
      XLSX.writeFile(workBook, `${SheetName}.${fileExtension}`);
    } catch (error: unknown) {
      if (error instanceof Error) {
        const errorMessage = error.message;

        if (errorMessage.includes("Cannot find module 'xlsx'")) {
          alert(t("responses.export.moduleMissing"));
          console.error("Error exporting data:", error.message);
        } else if (errorMessage.includes("json_to_sheet")) {
          alert(t("responses.export.convertFailed"));
        } else if (errorMessage.includes("writeFile")) {
          alert(t("responses.export.fileGenerationFailed"));
        } else {
          console.error("Unhandled export error:", error);
          alert(t("responses.export.failed", { message: errorMessage }));
        }
      } else {
        console.error("Error exporting data:", error);
        alert(t("responses.export.unknownError"));
      }
    }
  };

  return (
    <>
      <Button
        variant="outlined"
        endIcon={<KeyboardArrowDownIcon />}
        onClick={(e) => setMenuAnchor(e.currentTarget)}
      >
        {t("responses.export.buttonExcel")}
      </Button>
      <Menu
        anchorEl={menuAnchor}
        open={Boolean(menuAnchor)}
        onClose={() => setMenuAnchor(null)}
      >
        <MenuItem
          onClick={() => {
            setMenuAnchor(null);
            onDownloadClick("excel");
          }}
        >
          {t("responses.export.items.excel")}
        </MenuItem>
        <MenuItem
          onClick={() => {
            setMenuAnchor(null);
            onDownloadClick("csv");
          }}
        >
          {t("responses.export.items.csv")}
        </MenuItem>
      </Menu>
    </>
  );
};
