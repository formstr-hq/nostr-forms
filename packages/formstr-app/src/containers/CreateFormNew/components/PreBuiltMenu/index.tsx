import { Menu } from "antd";
import { useTranslation } from "react-i18next";
import { getPreBuiltMenu } from "../../configs/menuConfig";
import useFormBuilderContext from "../../hooks/useFormBuilderContext";

function PreBuiltMenu() {
  const { t } = useTranslation();
  const { addQuestion } = useFormBuilderContext();
  const preBuiltMenu = getPreBuiltMenu(t);

  const onMenuClick = ({ key }: { key: string }) => {
    const selectedItem = preBuiltMenu.find((item) => item.key === key);
    addQuestion(
      selectedItem?.primitive,
      selectedItem?.label,
      selectedItem?.answerSettings
    );
  };

  const items = [
    {
      key: "Pre-built",
      label: t("builder.menus.prebuilt"),
      children: preBuiltMenu,
      type: "group",
    },
  ];
  return <Menu selectedKeys={[]} items={items} onClick={onMenuClick} />;
}

export default PreBuiltMenu;
