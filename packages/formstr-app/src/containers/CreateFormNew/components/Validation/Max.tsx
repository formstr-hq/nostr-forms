import { Typography } from "antd";
import { InputStyle } from "./validation.style";
import { MaxRule, ValidationRuleTypes } from "../../../../nostr/types";
import { useTranslation } from "react-i18next";

const { Text } = Typography;

function Max({ rule, onChange }: { rule?: MaxRule; onChange: Function }) {
  const { t } = useTranslation();
  return (
    <InputStyle>
      <Text className="property-name">{t("builder.validation.maxLength")}</Text>
      <input
        className="number-input"
        type="number"
        value={rule?.max}
        onChange={(e) =>
          onChange(ValidationRuleTypes.max, { max: e.target.value })
        }
      />
    </InputStyle>
  );
}

export default Max;
