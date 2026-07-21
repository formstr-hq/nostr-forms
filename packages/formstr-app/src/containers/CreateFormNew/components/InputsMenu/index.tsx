import { useTranslation } from "react-i18next";
import { getInputsMenu } from "../../configs/menuConfig";
import useFormBuilderContext from "../../hooks/useFormBuilderContext";
import { MenuList } from "../MenuList";

function InputsMenu() {
  const { t } = useTranslation();
  const { addQuestion } = useFormBuilderContext();
  const inputsMenu = getInputsMenu(t);

  const onMenuClick = (key: string) => {
    const selectedItem = inputsMenu.find((item) => item.key === key);
    addQuestion(
      selectedItem?.primitive,
      undefined,
      selectedItem?.answerSettings,
    );
  };

  return (
    <MenuList
      items={inputsMenu}
      subheader={t("builder.menus.inputs")}
      onSelect={onMenuClick}
    />
  );
}

export default InputsMenu;
