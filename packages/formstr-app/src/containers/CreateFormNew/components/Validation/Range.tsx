import { Typography } from "antd";
import { InputStyle } from "./validation.style";
import { RangeRule, ValidationRuleTypes } from "../../../../nostr/types";
import { useTranslation } from "react-i18next";

const { Text } = Typography;

function Range({ rule, onChange }: { rule?: RangeRule; onChange: Function }) {
  const { t } = useTranslation();
  return (
    <>
      <InputStyle>
        <Text className="property-name">{t("builder.validation.minNumber")}</Text>
        <input
          className="number-input"
          type="number"
          value={rule?.min}
          onChange={(e) =>
            onChange(ValidationRuleTypes.range, {
              min: e.target.value,
              max: rule?.max,
            })
          }
        />
      </InputStyle>
      <InputStyle>
        <Text className="property-name">{t("builder.validation.maxNumber")}</Text>
        <input
          className="number-input"
          type="number"
          value={rule?.max}
          onChange={(e) =>
            onChange(ValidationRuleTypes.range, {
              min: rule?.min,
              max: e.target.value,
            })
          }
        />
      </InputStyle>
    </>
  );
}

export default Range;
