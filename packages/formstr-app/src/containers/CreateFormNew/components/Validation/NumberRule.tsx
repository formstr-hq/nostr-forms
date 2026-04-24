import { Typography, Input } from "antd";
import { ColumnInputStyle } from "./validation.style";
import { NumberValidationRule, ValidationRuleTypes } from "../../../../nostr/types";

const { Text } = Typography;

function NumberRule({
  rule,
  onChange,
}: {
  rule?: NumberValidationRule;
  onChange: (ruleType: ValidationRuleTypes, ruleObj: NumberValidationRule) => void;
}) {
  const currentType = rule?.type;
  if (!currentType) return null;

  const isOneInputRule = ![
    "between",
    "notBetween",
    "isNumber",
    "wholeNumber",
  ].includes(currentType);
  const isRangeRule = ["between", "notBetween"].includes(currentType);

  const handleValue1Change = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(ValidationRuleTypes.numberRule, {
      ...rule,
      value1: e.target.value ? Number(e.target.value) : undefined,
    });
  };

  const handleValue2Change = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(ValidationRuleTypes.numberRule, {
      ...rule,
      value2: e.target.value ? Number(e.target.value) : undefined,
    });
  };

  const handleErrorMessageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(ValidationRuleTypes.numberRule, {
      ...rule,
      errorMessage: e.target.value,
    });
  };

  return (
    <>
      {isOneInputRule && (
        <ColumnInputStyle>
          <Text className="property-name">Threshold Value: </Text>
          <Input
            type="number"
            placeholder="Enter value"
            value={rule?.value1}
            onChange={handleValue1Change}
          />
        </ColumnInputStyle>
      )}
      {isRangeRule && (
        <>
          <ColumnInputStyle>
            <Text className="property-name">Minimum Value:</Text>
            <Input
              type="number"
              placeholder="Min"
              value={rule?.value1}
              onChange={handleValue1Change}
            />
          </ColumnInputStyle>
          <ColumnInputStyle>
            <Text className="property-name">Maximum Value:</Text>
            <Input
              type="number"
              placeholder="Max"
              value={rule?.value2}
              onChange={handleValue2Change}
            />
          </ColumnInputStyle>
        </>
      )}
      <ColumnInputStyle>
        <Text className="property-name">Custom Error Text:</Text>
        <Input
          type="text"
          value={rule?.errorMessage || ""}
          onChange={handleErrorMessageChange}
          placeholder="Ex: 'Must be greater than 10'"
        />
      </ColumnInputStyle>
    </>
  );
}

export default NumberRule;
