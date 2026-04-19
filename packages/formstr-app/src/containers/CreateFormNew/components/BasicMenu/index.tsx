import { Menu } from "antd";
import { useTranslation } from "react-i18next";
import { getBasicMenu } from "../../configs/menuConfig";
import { BASIC_MENU_KEYS } from "../../configs/constants";
import useFormBuilderContext from "../../hooks/useFormBuilderContext";

function BasicMenu() {
  const { t } = useTranslation();
  const { addQuestion, addSection, sections } = useFormBuilderContext();
  const basicMenu = getBasicMenu(t);

  const onMenuClick = ({ key }: { key: string }) => {
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
        undefined,
        selectedItem?.answerSettings
      );
    }
  };

  return (
    <Menu
      items={basicMenu}
      onClick={onMenuClick}
      style={{ width: "100%", border: "none", wordBreak: "break-word", whiteSpace: "normal" }}
    />
  );
}

export default BasicMenu;
