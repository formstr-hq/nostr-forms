import { useState, useEffect } from "react";
import { Box, Card, CardContent, Skeleton, Typography } from "@mui/material";
import { useTranslation } from "react-i18next";
import { getPublicForms } from "../../nostr/publicForms";
import { Event } from "nostr-tools";
import { getDefaultRelays } from "../../nostr/common";
import PublicFormCard from "./PublicFormCard";

function PublicForms() {
  const { t } = useTranslation();
  const [isLoading, setIsLoading] = useState(false);
  const [forms, setForms] = useState<Event[]>([]);

  useEffect(() => {
    const handleFormEvent = (event: Event) => {
      setForms((prevForms) => {
        if (prevForms.some((f) => f.id === event.id)) {
          return prevForms;
        }
        return [...prevForms, event];
      });
      setIsLoading(false);
    };

    const loadingTimeout = setTimeout(() => {
      setIsLoading(false);
    }, 10000);

    setIsLoading(true);
    getPublicForms(getDefaultRelays(), handleFormEvent);

    return () => {
      clearTimeout(loadingTimeout);
    };
  }, []);

  return (
    <Box
      sx={{ display: "flex", flexDirection: "column", alignItems: "center" }}
    >
      <Typography color="text.secondary">
        {t("publicForms.recentlyPosted")}
      </Typography>
      {isLoading ? (
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            width: "100%",
            maxWidth: 760,
            gap: 2,
            mt: 2,
          }}
        >
          {Array(3)
            .fill(0)
            .map((_, index) => (
              <Card key={index} variant="outlined">
                <CardContent>
                  <Skeleton variant="text" width="40%" height={32} />
                  <Skeleton variant="text" />
                  <Skeleton variant="text" />
                </CardContent>
              </Card>
            ))}
        </Box>
      ) : forms.length > 0 ? (
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            width: "100%",
            maxWidth: 760,
            gap: 2,
            mt: 2,
          }}
        >
          {forms.map((f: Event) => {
            return <PublicFormCard key={f.id} event={f} />;
          })}
        </Box>
      ) : (
        <Typography
          color="text.secondary"
          sx={{ display: "block", textAlign: "center", m: 5 }}
        >
          {t("publicForms.empty")}
        </Typography>
      )}
    </Box>
  );
}

export default PublicForms;
