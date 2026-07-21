import { useTranslation } from "react-i18next";
import { getBasicMenu } from "../../configs/menuConfig";
import { BASIC_MENU_KEYS } from "../../configs/constants";
import useFormBuilderContext from "../../hooks/useFormBuilderContext";
import { MenuList } from "../MenuList";

function BasicMenu() {
  const { t } = useTranslation();
  const { addQuestion, addSection, sections } = useFormBuilderContext();
  const basicMenu = getBasicMenu(t);

  const onMenuClick = (key: string) => {
    if (key === BASIC_MENU_KEYS.SECTION) {
      const sectionNumber = sections.length + 1;
      addSection(
        t("builder.defaults.sectionTitle", { number: sectionNumber }),
        t("builder.defaults.sectionDescription"),
      );
      return;
    }

    const selectedItem = basicMenu.find((item) => item.key === key);
    if (selectedItem) {
      addQuestion(
        selectedItem?.primitive,
        selectedItem?.label,
        selectedItem?.answerSettings,
      );
    }
  };

  return <MenuList items={basicMenu} onSelect={onMenuClick} />;
}

export default BasicMenu;
