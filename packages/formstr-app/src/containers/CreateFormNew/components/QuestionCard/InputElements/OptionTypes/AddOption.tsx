import { PlusOutlined } from "@ant-design/icons";
import { Button, Typography } from "antd";
import { makeTag } from "../../../../../../utils/utility";
import { addOption } from "./utils";
import { Choice } from "./types";
import UploadImage from "../../UploadImage";
const { Text } = Typography;

interface AddOptionProps {
  choices: Array<Choice>;
  displayOther: boolean;
  disable: boolean;
  callback: (choices: Array<Choice>) => void;
}
export const AddOption: React.FC<AddOptionProps> = ({
  displayOther,
  disable,
  choices,
  callback,
}) => {
  return (
    <div className="addOptionButtons">
      <Button
        disabled={disable}
        type="dashed"
        onClick={(e) => {
          addOption([makeTag(6), "Add option"], choices, callback);
        }}
        icon={<PlusOutlined />}
      >
        Add Option
      </Button>
      <UploadImage 
        onImageUpload={(markdownUrl) => {
          addOption([makeTag(6), markdownUrl], choices, callback);
        }}
      />
      {displayOther && (
        <>
          <div className="orText">
            <Text disabled={disable}>{" or "}</Text>
          </div>
          <Button
            type="dashed"
            disabled={disable}
            onClick={(e) => {
              addOption([makeTag(6), "Other", JSON.stringify({ isOther: true })], choices, callback);
            }}
          >
            add other
          </Button>
        </>
      )}
    </div>
  );
};
