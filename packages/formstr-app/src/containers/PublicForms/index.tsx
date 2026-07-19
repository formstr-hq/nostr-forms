import { useState, useEffect } from "react";
import { Card, Typography, Skeleton } from "antd";
import { useTranslation } from "react-i18next";
import StyleWrapper from "./style";
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
    <StyleWrapper>
      <Typography.Text>{t("publicForms.recentlyPosted")}</Typography.Text>
      {isLoading ? (
        <div className="public-forms-list">
          {Array(3)
            .fill(0)
            .map((_, index) => (
              <Card key={index}>
                <Skeleton
                  active
                  title={{ width: "40%" }}
                  paragraph={{ rows: 2 }}
                />
              </Card>
            ))}
        </div>
      ) : forms.length > 0 ? (
        <div className="public-forms-list">
          {forms.map((f: Event) => {
            return <PublicFormCard key={f.id} event={f} />;
          })}
        </div>
      ) : (
        <Typography.Text
          style={{ display: "block", textAlign: "center", margin: "40px" }}
        >
          {t("publicForms.empty")}
        </Typography.Text>
      )}
    </StyleWrapper>
  );
}

export default PublicForms;
