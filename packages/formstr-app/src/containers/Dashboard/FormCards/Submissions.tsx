import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Table, Typography } from "antd";
import { useTranslation } from "react-i18next";
import EmptyScreen from "../../../components/EmptyScreen";
import { getSubmissions, ISubmission } from "../../../utils/submissions";
import { naddrUrl, isMobile, truncateNpub } from "../../../utils/utility";
import { ROUTES } from "../../../constants/routes";
import { useProfileContext } from "../../../hooks/useProfileContext";

const { Link } = Typography;

export const Submissions = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { pubkey } = useProfileContext();
  const [submissions, setSubmissions] = useState<ISubmission[]>([]);

  useEffect(() => {
    // Signed submissions belong to whichever account made them — hide the
    // ones made as a different account. Anonymous submissions aren't tied
    // to any identity, so they always show.
    setSubmissions(
      getSubmissions().filter(
        (s) => s.submittedAs === undefined || s.submittedAs === pubkey,
      ),
    );
  }, [pubkey]);

  if (submissions.length === 0) {
    return (
      <EmptyScreen
        message={t("dashboard.submissionsEmpty")}
        action={() => navigate(ROUTES.PUBLIC_FORMS)}
        actionLabel={t("dashboard.submissionsEmptyAction")}
      />
    );
  }

  const columns = [
    {
      key: "formName",
      title: t("dashboard.submissionsColumns.form"),
      dataIndex: "formName",
      ellipsis: true,
      render: (formName: string, submission: ISubmission) => (
        <Link
          onClick={() =>
            navigate(
              naddrUrl(
                submission.formPubkey,
                submission.formId,
                submission.relays,
              ),
            )
          }
        >
          {formName}
        </Link>
      ),
    },
    {
      key: "submittedAt",
      title: t("dashboard.submissionsColumns.submittedAt"),
      dataIndex: "submittedAt",
      width: isMobile() ? 110 : 180,
      render: (submittedAt: string) => new Date(submittedAt).toLocaleString(),
    },
    {
      key: "submittedAs",
      title: t("dashboard.submissionsColumns.submittedAs"),
      dataIndex: "submittedAs",
      ellipsis: true,
      render: (submittedAs: string | undefined) =>
        submittedAs
          ? truncateNpub(submittedAs)
          : t("dashboard.submissionsColumns.anonymous"),
    },
  ];

  return (
    <Table
      rowKey={(submission) => `${submission.formPubkey}:${submission.formId}`}
      columns={columns}
      dataSource={submissions}
      pagination={false}
      scroll={{ y: "calc(100vh - 228px)" }}
    />
  );
};
