import { Radio, Checkbox } from "antd";
import { useState, useEffect } from "react";
import {
  AnswerTypes,
  GridOptions,
  GridResponse,
} from "../../../../nostr/types";
import styled from "styled-components";
import SafeMarkdown from "../../../../components/SafeMarkdown";
import { isMobile } from "../../../../utils/utility";

interface GridFillerProps {
  options: string; // JSON string of GridOptions
  answerType: AnswerTypes.multipleChoiceGrid | AnswerTypes.checkboxGrid;
  onChange: (value: string, message?: string) => void;
  defaultValue?: string; // JSON string of GridResponse
  disabled?: boolean;
}

const GridContainer = styled.div`
  overflow-x: auto;
  margin-top: 8px;
`;

const MobileGridContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-top: 8px;
`;

const MobileRowCard = styled.div`
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  overflow: hidden;
`;

const MobileRowLabel = styled.div`
  background: #f5f5f5;
  padding: 8px 12px;
  font-weight: 600;
  font-size: 13px;
  border-bottom: 1px solid #e0e0e0;
`;

const MobileOptionRow = styled.label`
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 14px;
  font-size: 13px;
  cursor: pointer;
  border-bottom: 1px solid var(--app-color-border-soft);

  &:last-child {
    border-bottom: none;
  }

  &:active {
    background: #fafafa;
  }
`;

const GridTable = styled.table`
  width: 100%;
  border-collapse: collapse;
  // min-width: 400px;

  th,
  td {
    padding: 12px;
    text-align: center;
    border: 1px solid #e0e0e0;
  }

  th:first-child,
  td:first-child {
    text-align: left;
    font-weight: 500;
    // min-width: 150px;
  }

  thead th {
    background: #f5f5f5;
    font-weight: 600;
  }

  tbody tr:hover {
    background: #fafafa;
  }

  /* Mobile responsiveness */
  @media (max-width: 768px) {
    th,
    td {
      padding: 8px;
      font-size: 12px;
    }

    th:first-child,
    td:first-child {
      // min-width: 100px;
    }
  }
`;

export const GridFiller: React.FC<GridFillerProps> = ({
  options,
  answerType,
  onChange,
  defaultValue,
  disabled = false,
}) => {
  const gridOptions: GridOptions = JSON.parse(
    options || '{"columns":[],"rows":[]}',
  );
  const [responses, setResponses] = useState<GridResponse>(() => {
    try {
      return defaultValue ? JSON.parse(defaultValue) : {};
    } catch {
      return {};
    }
  });

  useEffect(() => {
    if (defaultValue) {
      try {
        setResponses(JSON.parse(defaultValue));
      } catch {
        setResponses({});
      }
    }
  }, [defaultValue]);

  const handleRadioChange = (rowId: string, columnId: string) => {
    if (disabled) return;

    const newResponses = { ...responses, [rowId]: columnId };
    setResponses(newResponses);
    onChange(JSON.stringify(newResponses));
  };

  const handleCheckboxChange = (
    rowId: string,
    columnId: string,
    checked: boolean,
  ) => {
    if (disabled) return;

    const current = responses[rowId]?.split(";").filter(Boolean) || [];
    const updated = checked
      ? [...current, columnId].sort()
      : current.filter((id) => id !== columnId);

    const newResponses = { ...responses };
    if (updated.length > 0) {
      newResponses[rowId] = updated.join(";");
    } else {
      delete newResponses[rowId];
    }

    setResponses(newResponses);
    onChange(JSON.stringify(newResponses));
  };

  const isRadioChecked = (rowId: string, columnId: string): boolean => {
    return responses[rowId] === columnId;
  };

  const isCheckboxChecked = (rowId: string, columnId: string): boolean => {
    return responses[rowId]?.split(";").includes(columnId) || false;
  };

  if (isMobile()) {
    return (
      <MobileGridContainer>
        {gridOptions.rows?.map(([rowId, rowLabel]) => (
          <MobileRowCard key={rowId}>
            <MobileRowLabel>
              <SafeMarkdown components={{ p: "span" }}>{rowLabel}</SafeMarkdown>
            </MobileRowLabel>
            {gridOptions.columns?.map(([colId, colLabel]) => (
              <MobileOptionRow key={colId}>
                {answerType === AnswerTypes.multipleChoiceGrid ? (
                  <Radio
                    checked={isRadioChecked(rowId, colId)}
                    onChange={() => handleRadioChange(rowId, colId)}
                    disabled={disabled}
                  />
                ) : (
                  <Checkbox
                    checked={isCheckboxChecked(rowId, colId)}
                    onChange={(e) =>
                      handleCheckboxChange(rowId, colId, e.target.checked)
                    }
                    disabled={disabled}
                  />
                )}
                <SafeMarkdown components={{ p: "span" }}>{colLabel}</SafeMarkdown>
              </MobileOptionRow>
            ))}
          </MobileRowCard>
        ))}
      </MobileGridContainer>
    );
  }

  return (
    <GridContainer>
      <GridTable>
        <thead>
          <tr>
            <th></th>
            {gridOptions.columns?.map(([colId, colLabel]) => (
              <th key={colId}>
                <SafeMarkdown>{colLabel}</SafeMarkdown>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {gridOptions.rows?.map(([rowId, rowLabel]) => (
            <tr key={rowId}>
              <td>
                <SafeMarkdown>{rowLabel}</SafeMarkdown>
              </td>
              {gridOptions.columns?.map(([colId]) => (
                <td key={colId}>
                  {answerType === AnswerTypes.multipleChoiceGrid ? (
                    <Radio
                      checked={isRadioChecked(rowId, colId)}
                      onChange={() => handleRadioChange(rowId, colId)}
                      disabled={disabled}
                    />
                  ) : (
                    <Checkbox
                      checked={isCheckboxChecked(rowId, colId)}
                      onChange={(e) =>
                        handleCheckboxChange(rowId, colId, e.target.checked)
                      }
                      disabled={disabled}
                    />
                  )}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </GridTable>
    </GridContainer>
  );
};
