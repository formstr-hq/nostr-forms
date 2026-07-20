import { Routes, Route, Navigate, Link } from "react-router-dom";
import { Box, Button, Typography } from "@mui/material";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import PublicForms from "../../containers/PublicForms";
import { ROUTES } from "../../constants/routes";
import { FormFiller } from "../../containers/FormFillerNew";
import { CreateFormHeader as CreateFormHeaderNew } from "../../containers/CreateFormNew/components/Header/Header";
import NewFormBuilderProvider from "../../containers/CreateFormNew/providers/FormBuilder";
import { Response } from "../../containers/ResponsesNew";
import { V1DraftsController } from "../../containers/Drafts";
import CreateForm from "../../containers/CreateFormNew";
import { Dashboard } from "../../containers/Dashboard";
import EditForm from "../../containers/EditForm";
import { CustomUrlForm } from "../../containers/FormFillerNew/CustomUrlForm";
import { AppLayout } from "../AppLayout";

const withNewCreateFormHeaderWrapper = (Component, props) => {
  return (
    <>
      <NewFormBuilderProvider>
        <CreateFormHeaderNew />
        <Component {...props} />
      </NewFormBuilderProvider>
    </>
  );
};

function Routing() {
  return (
    <Routes>
      <Route index element={<Navigate replace to={ROUTES.DASHBOARD} />} />

      {/* Builder routes: own header bound to the form-builder provider */}
      <Route
        path={`${ROUTES.CREATE_FORMS_NEW}/*`}
        element={withNewCreateFormHeaderWrapper(CreateForm)}
      />
      <Route
        path={`${ROUTES.EDIT_FORM_SECRET}/*`}
        element={withNewCreateFormHeaderWrapper(EditForm)}
      />

      {/* Respondent-facing routes: no app chrome */}
      <Route path={`${ROUTES.FORM_FILLER_NEW}/*`} element={<FormFiller />} />
      <Route path={`${ROUTES.CUSTOM_URL}`} element={<CustomUrlForm />} />
      <Route path={`${ROUTES.FORM_FILLER}/*`} element={<DeprecatedRoute />} />
      <Route
        path={`${ROUTES.FORM_FILLER_OLD}/*`}
        element={<DeprecatedRoute />}
      />
      <Route
        path={`${ROUTES.EMBEDDED}/*`}
        element={<DeprecatedRoute embedded={true} />}
      />

      {/* Main app: persistent header + container via AppLayout */}
      <Route element={<AppLayout />}>
        <Route
          path={`${ROUTES.DASHBOARD}/:filterType?`}
          element={<Dashboard />}
        />
        <Route path={`${ROUTES.PUBLIC_FORMS}/*`} element={<PublicForms />} />
        <Route path={`${ROUTES.RESPONSES_NEW}/*`} element={<Response />} />
        <Route path={`${ROUTES.RESPONSES_SECRET}/*`} element={<Response />} />
        <Route path={`${ROUTES.DRAFT}/*`} element={<V1DraftsController />} />
        <Route
          path="forms/:formSecret/responses"
          element={<DeprecatedRoute />}
        />
        <Route path={`${ROUTES.RESPONSES}/*`} element={<DeprecatedRoute />} />
      </Route>
    </Routes>
  );
}

const DeprecatedRoute = () => {
  return (
    <Box sx={{ textAlign: "center", py: 10 }}>
      <WarningAmberIcon sx={{ fontSize: 48, color: "warning.main" }} />
      <Typography variant="h5" sx={{ mt: 2 }}>
        Link Deprecated
      </Typography>
      <Typography
        variant="body2"
        color="text.secondary"
        sx={{ mt: 1, mb: 3, maxWidth: 420, mx: "auto" }}
      >
        This link is no longer supported. Please navigate to the dashboard or
        use the latest version of this page.
      </Typography>
      <Button component={Link} to={ROUTES.DASHBOARD} variant="contained">
        Go to Dashboard
      </Button>
    </Box>
  );
};

export default Routing;
