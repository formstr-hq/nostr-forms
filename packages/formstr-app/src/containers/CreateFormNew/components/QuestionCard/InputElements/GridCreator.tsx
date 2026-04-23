import { CloseOutlined, PlusOutlined } from "@ant-design/icons";
import { Button, Checkbox, Radio, Input } from "antd";
import { useState, useEffect } from "react";
import { GridOptions } from "../../../../../nostr/types";
import { makeTag } from "../../../../../utils/utility";
import styled from "styled-components";
import { useTranslation } from "react-i18next";

interface GridCreatorProps {
  initialValue?: GridOptions;
  onValuesChange: (options: GridOptions) => void;
  allowMultiple: boolean;
}

type GridItem = [id: string, label: string, config?: string];

const GridContainer = styled.div`
  width: 100%;
  overflow-x: auto;
  margin-top: 8px;
`;

const GridTable = styled.table`
  width: 100%;
  border-collapse: collapse;
  min-width: 400px;

  th,
  td {
    padding: 8px;
    text-align: center;
    border: 1px solid #d9d9d9;
    position: relative;
  }

  th:first-child,
  td:first-child {
    text-align: left;
    font-weight: 500;
    min-width: 150px;
    background: #fafafa;
  }

  thead th {
    background: #f5f5f5;
    font-weight: 600;
  }

  tbody tr:hover {
    background: #fafafa;
  }

  .cell-input {
    width: 100%;
    border: none;
    background: transparent;
    text-align: inherit;
    padding: 0;

    &:focus {
      outline: 2px solid #1890ff;
      outline-offset: -2px;
      background: white;
    }
  }

  .delete-btn {
    position: absolute;
    right: 2px;
    top: 50%;
    transform: translateY(-50%);
    cursor: pointer;
    color: #8c8c8c;
    padding: 2px;

    &:hover {
      color: #ff4d4f;
    }
  }

  .add-column-cell {
    background: #fafafa;
    cursor: pointer;
    color: #ff4d4f;

    &:hover {
      background: #e6f7ff;
    }
  }
`;

const AddRowButton = styled(Button)`
  margin-top: 8px;
  width: 100%;
`;

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
    <div>
      <GridContainer>
        <GridTable>
          <thead>
            <tr>
              <th></th>
              {columns.map((col) => (
                <th key={col[0]}>
                  <Input
                    className="cell-input"
                    value={col[1]}
                    onChange={(e) =>
                      handleColumnLabelChange(col[0], e.target.value)
                    }
                    placeholder={t("builder.grid.columnPlaceholder")}
                    style={{ textAlign: "center", fontWeight: 600 }}
                  />
                  {columns.length > 1 && (
                    <CloseOutlined
                      className="delete-btn"
                      onClick={() => handleColumnDelete(col[0])}
                    />
                  )}
                </th>
              ))}
              {columns.length < 10 && (
                <th className="add-column-cell" onClick={handleColumnAdd}>
                  <PlusOutlined /> {t("builder.grid.addColumn")}
                </th>
              )}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row[0]}>
                <td>
                  <Input
                    className="cell-input"
                    value={row[1]}
                    onChange={(e) =>
                      handleRowLabelChange(row[0], e.target.value)
                    }
                    placeholder={t("builder.grid.rowPlaceholder")}
                  />
                  {rows.length > 1 && (
                    <CloseOutlined
                      className="delete-btn"
                      onClick={() => handleRowDelete(row[0])}
                    />
                  )}
                </td>
                {columns.map((col) => (
                  <td key={col[0]}>
                    {allowMultiple ? <Checkbox disabled /> : <Radio disabled />}
                  </td>
                ))}
                {columns.length < 10 && <td></td>}
              </tr>
            ))}
          </tbody>
        </GridTable>
      </GridContainer>
      {rows.length < 10 && (
        <AddRowButton
          type="dashed"
          onClick={handleRowAdd}
          icon={<PlusOutlined />}
        >
          {t("builder.grid.addRow")}
        </AddRowButton>
      )}
    </div>
  );
};
