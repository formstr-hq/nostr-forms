import Sidebar from "./components/Sidebar";
import { QuestionsList } from "./components/QuestionsList";
import Settings from "./components/Settings";
import StyledWrapper from "./index.style";
import { useRef } from "react";
import { useOutsideClickHandler } from "./hooks/useOutsideClickHandler";
import useFormBuilderContext from "./hooks/useFormBuilderContext";

function FormBuilder() {
  const leftSidebarRef = useRef<HTMLInputElement>(null);
  const rightSidebarRef = useRef<HTMLInputElement>(null);

  const {
    isRightSettingsOpen,
    isLeftMenuOpen,
    closeSettingsOnOutsideClick,
    closeMenuOnOutsideClick,
  } = useFormBuilderContext();

  useOutsideClickHandler(leftSidebarRef, closeMenuOnOutsideClick);
  useOutsideClickHandler(rightSidebarRef, closeSettingsOnOutsideClick);

  return (
    <StyledWrapper
      $isOpen={isLeftMenuOpen}
      $isRightSettingsOpen={isRightSettingsOpen}
    >
      <div className="builder-row">
        <Sidebar ref={leftSidebarRef} />
        <QuestionsList />
        <Settings ref={rightSidebarRef} />
      </div>
    </StyledWrapper>
  );
}

export default FormBuilder;
