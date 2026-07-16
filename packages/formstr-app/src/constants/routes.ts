import { Dashboard } from "../containers/Dashboard";

export const ROUTES = {
  CREATE_FORMS_NEW: "/c",
  DASHBOARD: "/dashboard",
  PUBLIC_FORMS: "/public",
  FORM_FILLER: "/fill/:formId",
  FORM_FILLER_OLD: "/forms/:formId",
  FORM_FILLER_NEW: "/f/:naddr",
  EDIT_FORM_SECRET: "edit/:naddr",
  PREVIEW: "/preview",
  RESPONSES: "/response/:formSecret",
  RESPONSES_NEW: "/r/:pubKey/:identifier",
  RESPONSES_SECRET: "/s/:naddr",
  DRAFT: "/drafts/:encodedForm",
  EMBEDDED: "/embedded/:formId",
  DASHBOARD_LOCAL: "/dashboard/local",
  DASHBOARD_SHARED: "/dashboard/shared",
  DASHBOARD_MY_FORMS: "/dashboard/my-forms",
  DASHBOARD_DRAFTS: "/dashboard/drafts",
  DASHBOARD_SUBMISSIONS: "/dashboard/submissions",
  CUSTOM_URL: "/i/:formSlug",
  DASHBOARD_PURCHASES: "/dashboard/purchases",
};
