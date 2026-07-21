import { useTranslation } from "react-i18next";
import { getPreBuiltMenu } from "../../configs/menuConfig";
import useFormBuilderContext from "../../hooks/useFormBuilderContext";
import { MenuList } from "../MenuList";

function PreBuiltMenu() {
  const { t } = useTranslation();
  const { addQuestion } = useFormBuilderContext();
  const preBuiltMenu = getPreBuiltMenu(t);

  const onMenuClick = (key: string) => {
    const selectedItem = preBuiltMenu.find((item) => item.key === key);
    addQuestion(
      selectedItem?.primitive,
      selectedItem?.label,
      selectedItem?.answerSettings,
    );
  };

  return (
    <MenuList
      items={preBuiltMenu}
      subheader={t("builder.menus.prebuilt")}
      onSelect={onMenuClick}
    />
  );
}

export default PreBuiltMenu;
