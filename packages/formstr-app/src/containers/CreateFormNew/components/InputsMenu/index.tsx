import { Menu } from "antd";
import { useTranslation } from "react-i18next";
import { getInputsMenu } from "../../configs/menuConfig";
import useFormBuilderContext from "../../hooks/useFormBuilderContext";

function InputsMenu() {
  const { t } = useTranslation();
  const { addQuestion } = useFormBuilderContext();
  const inputsMenu = getInputsMenu(t);

  const onMenuClick = ({ key }: { key: string }) => {
    const selectedItem = inputsMenu.find((item) => item.key === key);
    addQuestion(
      selectedItem?.primitive,
      undefined,
      selectedItem?.answerSettings,
    );
  };

  const items = [
    {
      key: "Inputs",
      label: t("builder.menus.inputs"),
      children: inputsMenu,
      type: "group",
    },
  ];
  return (
    <Menu
      selectedKeys={[]}
      items={items}
      onClick={onMenuClick}
    />
  );
}

export default InputsMenu;
