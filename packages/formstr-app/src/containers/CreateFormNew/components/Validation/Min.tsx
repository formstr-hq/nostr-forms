import { Typography } from "antd";
import { InputStyle } from "./validation.style";
import { MinRule, ValidationRuleTypes } from "../../../../nostr/types";
import { useTranslation } from "react-i18next";

const { Text } = Typography;

function Min({ rule, onChange }: { rule?: MinRule; onChange: Function }) {
  const { t } = useTranslation();
  return (
    <InputStyle>
      <Text className="property-name">{t("builder.validation.minLength")}</Text>
      <input
        className="number-input"
        type="number"
        value={rule?.min}
        onChange={(e) =>
          onChange(ValidationRuleTypes.min, { min: e.target.value })
        }
      />
    </InputStyle>
  );
}

export default Min;
