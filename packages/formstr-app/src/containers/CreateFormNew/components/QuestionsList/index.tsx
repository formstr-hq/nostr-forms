import QuestionCard from "../QuestionCard";
import { Box, Fab, Typography } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import FormTitle from "../FormTitle";
import useFormBuilderContext from "../../hooks/useFormBuilderContext";
import React, { useRef } from "react";
import { useTranslation } from "react-i18next";
import { AnimatePresence, motion } from "framer-motion";
import { Field } from "../../../../nostr/types";
import AIFormGeneratorModal from "../AIFormGeneratorModal";
import Section from "../SectionManager/Section";
import { ColorfulMarkdownTextarea } from "../../../../components/SafeMarkdown/ColorfulMarkdownInput";
import GoogleFormImportModal from "../GoogleFormImportModal";
import { MEDIA_QUERY_MOBILE } from "../../../../utils/css";

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
      <Fab
        color="primary"
        aria-label="add question"
        onClick={onClick}
        sx={{ boxShadow: "0 4px 12px rgba(0,0,0,0.15)" }}
      >
        <AddIcon />
      </Fab>
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
    isImportModalVisible,
    setIsImportModalVisible,
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
      (question) => !getSectionForQuestion(question[1]),
    );

    return (
      <div className="sectioned-form">
        {unsectionedQuestions.length > 0 && (
          <Box
            sx={{
              mb: 3,
              p: 2,
              border: "1.5px dashed #000000",
              borderRadius: 2,
              backgroundColor: "rgba(255, 255, 255, 0.4)",
            }}
          >
            <Typography variant="h6" sx={{ mb: 2, color: "text.secondary" }}>
              {t("builder.questionsList.unsectionedQuestions")}
            </Typography>
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
          </Box>
        )}

        {sections.map((section) => {
          const sectionQuestions = questionsList.filter(
            (question) => getSectionForQuestion(question[1]) === section.id,
          );

          return (
            <Section
              key={section.id}
              section={section}
              sectionIndex={sections.indexOf(section) + 1}
              totalSections={sections.length}
            >
              {sectionQuestions.length === 0 ? (
                <Typography
                  color="text.secondary"
                  sx={{ textAlign: "center", py: 3 }}
                >
                  {t("builder.questionsList.emptySection")}
                </Typography>
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
    <Box
      className="main-content"
      onClick={() => setQuestionIdInFocus()}
      ref={containerRef}
      sx={{
        position: "relative",
        backgroundColor: formSettings.backgroundImageUrl
          ? "transparent"
          : "#dedede",
        backgroundImage: formSettings.backgroundImageUrl
          ? `url(${formSettings.backgroundImageUrl})`
          : "none",
        backgroundRepeat: "repeat",
        backgroundPosition: "center top",
        backgroundSize: "auto",
        px: 4,
        overflow: "scroll",
        // Height comes from .builder-row — percentage, not viewport units.
        height: "100%",
        width: "calc(100vw - 482px)",
        [MEDIA_QUERY_MOBILE]: { width: "100%", px: 1 },
        ".form-title": {
          position: "relative",
          mt: "30px",
          borderRadius: "10px",
          overflow: "hidden",
          ...(formSettings.titleImageUrl
            ? { height: 250, backgroundColor: "primary.main" }
            : {
                height: "auto",
                backgroundColor: "transparent",
                borderRadius: 0,
                mt: "16px",
              }),
        },
        ".form-description": {
          textAlign: "left",
          p: "1em",
        },
        ".mobile-add-btn": {
          display: "none",
          [MEDIA_QUERY_MOBILE]: {
            display: "block",
            position: "fixed",
            right: 10,
            bottom: 80,
            m: 1,
            zIndex: 1000,
          },
        },
        ".reorder-group": { listStyle: "none", p: 0 },
      }}
    >
      <div>
        <FormTitle className="form-title" />
        <Box className="form-description">
          <ColorfulMarkdownTextarea
            value={formSettings.description || ""}
            onChange={handleDescriptionChange}
            placeholder={t("builder.questionsList.descriptionPlaceholder")}
            color={
              formSettings.colors?.description ??
              formSettings.colors?.global ??
              formSettings.globalColor
            }
          />
        </Box>
      </div>

      {questionsList.length > 0 ? (
        renderQuestions()
      ) : (
        <Box sx={{ textAlign: "center", p: "40px" }}>
          <Typography color="text.secondary">
            {t("builder.questionsList.empty")}
          </Typography>
        </Box>
      )}

      <div ref={bottomElementRef} style={{ height: "1px" }}></div>
      <Box className="mobile-add-btn">
        <FloatingButton
          onClick={onPlusButtonClick}
          containerRef={containerRef}
        />
      </Box>
      <AIFormGeneratorModal
        isOpen={isAiModalOpen}
        onClose={() => setIsAiModalOpen(false)}
        onFormGenerated={handleAIFormGenerated}
      />
      <GoogleFormImportModal
        isOpen={isImportModalVisible}
        onClose={() => setIsImportModalVisible(false)}
      />
    </Box>
  );
};
