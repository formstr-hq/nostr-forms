import QuestionCard from "../QuestionCard";
import { Button, Input, Empty, Typography } from "antd";
import FormTitle from "../FormTitle";
import StyleWrapper from "./style";
import DescriptionStyle from "./description.style";
import useFormBuilderContext from "../../hooks/useFormBuilderContext";
import React, { ChangeEvent, useRef } from "react";
import { useTranslation } from "react-i18next";
import { AnimatePresence, motion } from "framer-motion";
import { Field } from "../../../../nostr/types";
import AIFormGeneratorModal from "../AIFormGeneratorModal";
import Section from "../SectionManager/Section";
import { ColorfulMarkdownTextarea } from "../../../../components/SafeMarkdown/ColorfulMarkdownInput";

const { Text } = Typography;

interface FloatingButtonProps {
  onClick: () => void;
  containerRef: React.RefObject<HTMLDivElement>;
}

const FloatingButton = ({ onClick }: FloatingButtonProps) => {
  return (
    <motion.div
      drag
      dragMomentum={false}
      whileTap={{ scale: 0.95 }}
      whileHover={{ scale: 1.05 }}
      style={{
        position: "fixed",
        right: "30px",
        bottom: "30px",
        zIndex: 1000,
        cursor: "grab",
      }}
    >
      <Button
        type="primary"
        shape="circle"
        size="large"
        icon={<span style={{ fontSize: "24px", lineHeight: "0" }}>+</span>}
        onClick={onClick}
        style={{
          width: 56,
          height: 56,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
          paddingTop: 15,
        }}
      />
    </motion.div>
  );
};

interface QuestionItemProps {
  question: Field;
  onEdit: (question: Field, tempId: string) => void;
  onReorderKey: (keyType: "UP" | "DOWN", tempId: string) => void;
  firstQuestion: boolean;
  lastQuestion: boolean;
}

const QuestionItem: React.FC<QuestionItemProps> = ({
  question,
  onEdit,
  onReorderKey,
  firstQuestion,
  lastQuestion,
}) => {
  return (
    <motion.div
      key={question[1]}
      layout // 🔑 enables smooth reordering animations
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.2 }}
    >
      <QuestionCard
        question={question}
        onEdit={onEdit}
        onReorderKey={onReorderKey}
        firstQuestion={firstQuestion}
        lastQuestion={lastQuestion}
      />
    </motion.div>
  );
};

export const QuestionsList = () => {
  const { t } = useTranslation();
  const containerRef = useRef<HTMLDivElement>(null);

  const {
    formSettings,
    questionsList,
    editQuestion,
    setQuestionIdInFocus,
    updateFormSetting,
    updateQuestionsList,
    setIsLeftMenuOpen,
    bottomElementRef,
    isAiModalOpen,
    setIsAiModalOpen,
    handleAIFormGenerated,
    sections,
    getSectionForQuestion,
  } = useFormBuilderContext();

  const handleDescriptionChange = (newDescr: string) => {
    updateFormSetting({ description: newDescr });
  };

  const onReorderKey = (keyType: "UP" | "DOWN", tempId: string) => {
    updateQuestionsList((prevQuestions: Field[]) => {
      const index = prevQuestions.findIndex((q) => q[1] === tempId);
      if (index === -1) return prevQuestions;

      const targetIndex = keyType === "UP" ? index - 1 : index + 1;
      if (targetIndex < 0 || targetIndex >= prevQuestions.length)
        return prevQuestions;

      const newQuestions = [...prevQuestions];
      [newQuestions[index], newQuestions[targetIndex]] = [
        newQuestions[targetIndex],
        newQuestions[index],
      ];

      return newQuestions;
    });
  };

  const onPlusButtonClick = () => {
    setIsLeftMenuOpen(true);
  };

  const renderQuestions = () => {
    if (!sections || sections.length === 0) {
      return (
        <div>
          <AnimatePresence initial={false}>
            {questionsList.map((question, idx) => (
              <QuestionItem
                key={question[1]}
                question={question}
                onEdit={editQuestion}
                onReorderKey={onReorderKey}
                firstQuestion={idx === 0}
                lastQuestion={idx === questionsList.length - 1}
              />
            ))}
          </AnimatePresence>

          <div ref={bottomElementRef}></div>
        </div>
      );
    }

    const unsectionedQuestions = questionsList.filter(
      (question) => !getSectionForQuestion(question[1])
    );

    return (
      <div className="sectioned-form">
        {unsectionedQuestions.length > 0 && (
          <div
            style={{
              marginBottom: 24,
              padding: 16,
              border: "1.5px dashed #000000",
              borderRadius: 8,
              backgroundColor: "rgba(255, 255, 255, 0.4)"
            }}
          >
            <h4 style={{ margin: "0 0 16px 0", color: "#8c8c8c" }}>
              {t("builder.questionsList.unsectionedQuestions")}
            </h4>
            {unsectionedQuestions.map((question, idx) => (
              <QuestionItem
                key={question[1]}
                question={question}
                onEdit={editQuestion}
                onReorderKey={onReorderKey}
                firstQuestion={idx === 0}
                lastQuestion={idx === unsectionedQuestions.length - 1}
              />
            ))}
          </div>
        )}

        {sections.map((section) => {
          const sectionQuestions = questionsList.filter(
            (question) => getSectionForQuestion(question[1]) === section.id
          );

          return (
            <Section
              key={section.id}
              section={section}
              sectionIndex={sections.indexOf(section) + 1}
              totalSections={sections.length}
            >
              {sectionQuestions.length === 0 ? (
                <Empty
                  description={t("builder.questionsList.emptySection")}
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                />
              ) : (
                sectionQuestions.map((question, idx) => (
                  <QuestionItem
                    key={question[1]}
                    question={question}
                    onEdit={editQuestion}
                    onReorderKey={onReorderKey}
                    firstQuestion={idx === 0}
                    lastQuestion={idx === sectionQuestions.length - 1}
                  />
                ))
              )}
            </Section>
          );
        })}
        <div ref={bottomElementRef}></div>
      </div>
    );
  };

  return (
    <StyleWrapper
      className="main-content"
      onClick={() => setQuestionIdInFocus()}
      ref={containerRef}
      style={{ position: "relative" }}
      $bgImage={formSettings.backgroundImageUrl}
      $titleImageUrl={formSettings.titleImageUrl}
    >
      <div>
        <FormTitle className="form-title" />
        <DescriptionStyle>
          <div className="form-description">
            <ColorfulMarkdownTextarea
              value={formSettings.description || ""}
              onChange={handleDescriptionChange}
              placeholder={t("builder.questionsList.descriptionPlaceholder")}
              color={formSettings.colors?.description ?? formSettings.colors?.global ?? formSettings.globalColor}
            />
          </div>
        </DescriptionStyle>
      </div>

      {questionsList.length > 0 ? (
        renderQuestions()
      ) : (
        <div style={{ textAlign: "center", padding: "40px", color: "grey" }}>
          <Text type="secondary">
            {t("builder.questionsList.empty")}
          </Text>
        </div>
      )}

      <div ref={bottomElementRef} style={{ height: "1px" }}></div>
      <div className="mobile-add-btn">
        <FloatingButton
          onClick={onPlusButtonClick}
          containerRef={containerRef}
        />
      </div>
      <AIFormGeneratorModal
        isOpen={isAiModalOpen}
        onClose={() => setIsAiModalOpen(false)}
        onFormGenerated={handleAIFormGenerated}
      />
    </StyleWrapper>
  );
};
