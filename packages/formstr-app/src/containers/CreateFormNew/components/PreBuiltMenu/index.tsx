import { Menu } from "antd";
import { PRE_BUILT_MENU } from "../../configs/menuConfig";
import useFormBuilderContext from "../../hooks/useFormBuilderContext";

function PreBuiltMenu() {
  const { addQuestion } = useFormBuilderContext();

  const onMenuClick = ({ key }: { key: string }) => {
    const selectedItem = PRE_BUILT_MENU.find((item) => item.key === key);
    addQuestion(
      selectedItem?.primitive,
      undefined,
      selectedItem?.answerSettings
    );
  };

  const items = [
    {
      key: "Pre-built",
      label: "Pre-built",
      children: PRE_BUILT_MENU,
      type: "group",
    },
  ];
  return <Menu selectedKeys={[]} items={items} onClick={onMenuClick} />;
}

export default PreBuiltMenu;
