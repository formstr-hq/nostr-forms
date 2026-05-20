import React from "react";
import { Dropdown, MenuProps } from "antd";
import { DownOutlined } from "@ant-design/icons";
import { useTranslation } from "react-i18next";

export const Export: React.FC<{
  responsesData: Array<{ [key: string]: string }>;
  formName: string;
}> = ({ responsesData, formName }) => {
  const { t } = useTranslation();
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

  const items = [
    {
      label: t("responses.export.items.excel"),
      key: "excel",
    },
    {
      label: t("responses.export.items.csv"),
      key: "csv",
    },
  ];

  const handleMenuClick: MenuProps["onClick"] = (e) => {
    onDownloadClick(e.key as "csv" | "excel");
  };

  const menuProps: MenuProps = {
    items,
    onClick: handleMenuClick,
  };

  const handleButtonClick = () => {
    onDownloadClick("excel");
  };

  return (
    <Dropdown.Button
      menu={menuProps}
      className="export-excel"
      type="text"
      onClick={handleButtonClick}
      icon={<DownOutlined />}
    >
      {t("responses.export.buttonExcel")}
    </Dropdown.Button>
  );
};
