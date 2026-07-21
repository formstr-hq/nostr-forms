import { Dialog, DialogContent } from "@mui/material";
import GoogleFormsDeployer from "../../../../components/GoogleFormsDeployer";
import { FetchResult } from "../../../../components/GoogleFormsDeployer/types";
import { mapGoogleFormQuestionsToFieldsAndSections } from "../../../../components/GoogleFormsDeployer/helper";
import { makeTag } from "../../../../utils/utility";
import { ROUTES } from "../../../../constants/routes";
import { useNavigate } from "react-router-dom";
import { useSnackbar } from "../../../../providers/SnackbarProvider";

export interface GoogleFormImportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const GoogleFormImportModal: React.FC<GoogleFormImportModalProps> = ({
  isOpen,
  onClose,
}) => {
  const navigate = useNavigate();
  const { showMessage } = useSnackbar();

  const handleGoogleFetchRender = (result: FetchResult) => {
    if (!result.success || !Array.isArray(result.data?.questions)) {
      showMessage("No form schema available to render.", "error");
      return;
    }
    const { fields, sections } = mapGoogleFormQuestionsToFieldsAndSections(
      result.data!.questions,
    );
    if (!fields.length) {
      showMessage(
        "No supported questions found in this Google Form.",
        "warning",
      );
      return;
    }
    const formId = makeTag(6);
    const spec = [
      ["d", formId],
      ["name", result.data?.title || "Imported Google Form"],
      [
        "settings",
        JSON.stringify({
          thankYouPage: true,
          publicForm: true,
          disallowAnonymous: false,
          encryptForm: true,
          viewKeyInUrl: true,
          description: result.data?.description || "",
          ...(sections.length > 0 ? { sections } : {}),
        }),
      ],
      ...fields,
    ];
    onClose();
    navigate(ROUTES.CREATE_FORMS_NEW, {
      state: {
        spec,
        id: formId,
      },
      replace: true,
    });
    showMessage("Google Form rendered in Form Builder.", "success");
  };

  return (
    <Dialog open={isOpen} onClose={onClose} maxWidth="lg" fullWidth>
      <DialogContent>
        <GoogleFormsDeployer
          onFetch={(json) => console.log(json)}
          onRenderInBuilder={handleGoogleFetchRender}
        />
      </DialogContent>
    </Dialog>
  );
};

export default GoogleFormImportModal;
