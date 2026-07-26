import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Link,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from "@mui/material";
import { useTranslation } from "react-i18next";
import EmptyScreen from "../../../components/EmptyScreen";
import { getSubmissions, ISubmission } from "../../../utils/submissions";
import { naddrUrl, isMobile, truncateNpub } from "../../../utils/utility";
import { ROUTES } from "../../../constants/routes";
import { useProfileContext } from "../../../hooks/useProfileContext";

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
      <Box sx={{ gridColumn: "1 / -1" }}>
        <EmptyScreen
          message={t("dashboard.submissionsEmpty")}
          action={() => navigate(ROUTES.PUBLIC_FORMS)}
          actionLabel={t("dashboard.submissionsEmptyAction")}
        />
      </Box>
    );
  }

  return (
    <TableContainer
      sx={{
        gridColumn: "1 / -1",
        maxHeight: "calc(100vh - 228px)",
        bgcolor: "background.paper",
        border: 1,
        borderColor: "divider",
        borderRadius: 1.5,
      }}
    >
      <Table stickyHeader size="small">
        <TableHead>
          <TableRow>
            <TableCell>{t("dashboard.submissionsColumns.form")}</TableCell>
            <TableCell width={isMobile() ? 110 : 180}>
              {t("dashboard.submissionsColumns.submittedAt")}
            </TableCell>
            <TableCell>
              {t("dashboard.submissionsColumns.submittedAs")}
            </TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {submissions.map((submission) => (
            <TableRow
              key={`${submission.formPubkey}:${submission.formId}`}
              hover
            >
              <TableCell
                sx={{
                  maxWidth: 0,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                <Link
                  component="button"
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
                  {submission.formName}
                </Link>
              </TableCell>
              <TableCell>
                {new Date(submission.submittedAt).toLocaleString()}
              </TableCell>
              <TableCell
                sx={{
                  maxWidth: 0,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {submission.submittedAs
                  ? truncateNpub(submission.submittedAs)
                  : t("dashboard.submissionsColumns.anonymous")}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};
