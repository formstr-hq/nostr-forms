import React, { useRef } from "react";
import {
  ArrowDownOutlined,
  ArrowUpOutlined,
  CopyOutlined,
  HolderOutlined,
  MoreOutlined,
} from "@ant-design/icons";
import { ReactComponent as Asterisk } from "../../../../Images/asterisk.svg";
import StyledWrapper from "./CardHeader.style";
import useFormBuilderContext from "../../hooks/useFormBuilderContext";
import useDeviceType from "../../../../hooks/useDeviceType";
import { classNames } from "../../../../utils/utility";
import DeleteButton from "./DeleteButton";
import { Field } from "../../../../nostr/types";
import { DragControls, motion } from "framer-motion";

interface CardHeaderProps {
  required?: boolean;
  onRequired: (required: boolean) => void;
  question: Field;
  onReorderKey: (keyType: "UP" | "DOWN", tempId: string) => void;
  firstQuestion: boolean;
  lastQuestion: boolean;
  dragControls: DragControls;
}

const CardHeader: React.FC<CardHeaderProps> = ({
  required,
  onRequired,
  onReorderKey,
  question,
  firstQuestion,
  lastQuestion,
  dragControls,
}) => {
  const { MOBILE } = useDeviceType();
  const { toggleSettingsWindow, deleteQuestion, setQuestionIdInFocus, duplicateQuestion } =
    useFormBuilderContext();
  const isDragging = useRef(false);

  return (
    <StyledWrapper>
      <div className="action-wrapper">
        <div style={{ display: "flex" }}>
          {!firstQuestion && (
            <div
              className="action-icon"
              onClick={(e) => {
                onReorderKey("UP", question[1]);
              }}
            >
              <ArrowUpOutlined className="icon-svg" />
            </div>
          )}
          {!lastQuestion && (
            <div
              className="action-icon"
              onClick={(e) => {
                onReorderKey("DOWN", question[1]);
              }}
            >
              <ArrowDownOutlined className="icon-svg" />
            </div>
          )}
          <div className="action-icon">
            <Asterisk
              className={classNames("asterisk", { asteriskSelected: required })}
              onClick={() => {
                onRequired(!required);
              }}
            />
          </div>
          <DeleteButton
            className="action-icon"
            onDelete={() => {
              deleteQuestion(question[1]);
              setQuestionIdInFocus(undefined);
            }}
          />
          <div
            className="action-icon"
            onClick={() => duplicateQuestion(question[1])}
            title="Duplicate question"
          >
            <CopyOutlined className="icon-svg" />
          </div>
        </div>

        {MOBILE && (
          <div className="action-icon">
            <MoreOutlined onClick={toggleSettingsWindow} />
          </div>
        )}
      </div>
      <motion.div
        className="drag-handle"
        onPointerDown={(e) => {
          isDragging.current = true;
          dragControls.start(e);
        }}
        onPointerUp={() => {
          isDragging.current = false;
        }}
        whileHover={{ scale: 1.15, color: "#595959" }}
        style={{
          cursor: "grab",
          display: "flex",
          justifyContent: "center",
          padding: "4px 0",
          color: "#d9d9d9",
          touchAction: "none",
        }}
        title="Drag to reorder"
      >
        <HolderOutlined style={{ fontSize: 18, transform: "rotate(90deg)" }} />
      </motion.div>
    </StyledWrapper>
  );
};

export default CardHeader;

