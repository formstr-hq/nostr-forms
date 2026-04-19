import { Modal , message } from "antd";
import GoogleFormsDeployer from "../../../../components/GoogleFormsDeployer";
import { FetchResult } from "../../../../components/GoogleFormsDeployer/types";
import { mapGoogleFormQuestionsToFieldsAndSections } from "../../../../components/GoogleFormsDeployer/helper";
import { makeTag } from "../../../../utils/utility";
import { ROUTES } from "../../../../constants/routes";
import { useNavigate } from "react-router-dom";

export interface GoogleFormImportModalProps {
    isOpen: boolean;
    onClose: () => void;
}


const GoogleFormImportModal :React.FC<GoogleFormImportModalProps> = ({ isOpen, onClose }) => {
    const navigate = useNavigate();

    const handleGoogleFetchRender = (result: FetchResult) => {
        if (!result.success || !Array.isArray(result.data?.questions)) {
        message.error("No form schema available to render.");
        return;
        }
        const { fields, sections } = mapGoogleFormQuestionsToFieldsAndSections(
        result.data!.questions,
        );
        if (!fields.length) {
        message.warning("No supported questions found in this Google Form.");
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
        message.success("Google Form rendered in Form Builder.");
    };


  return (
    <div>
      <Modal
        open={isOpen}
        onCancel={onClose}
        footer={null}
        width={1000}
      >
        <GoogleFormsDeployer
          onFetch={(json) => console.log(json)}
          onRenderInBuilder={handleGoogleFetchRender}
        />
      </Modal>
    </div>
  )
}

export default GoogleFormImportModal
