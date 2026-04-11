import { useState, useEffect } from "react";
import { Card, Divider, Typography, Skeleton } from "antd";
import StyleWrapper from "./style";
import { getPublicForms } from "../../nostr/publicForms";
import { Event } from "nostr-tools";
import { getDefaultRelays } from "../../nostr/common";
import PublicFormCard from "./PublicFormCard";

function PublicForms() {
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
    const subCloser = getPublicForms(getDefaultRelays(), handleFormEvent);

    return () => {
      clearTimeout(loadingTimeout);
      if (subCloser) {
        subCloser.close();
      }
    };
  }, []);

  return (
    <StyleWrapper>
      <Typography.Text>Recently Posted</Typography.Text>
      {isLoading ? (
        <div
          style={{
            alignItems: "center",
            display: "flex",
            flexDirection: "column",
            marginLeft: "10%",
            marginRight: "10%",
            width: "80%",
          }}
        >
          {Array(3)
            .fill(0)
            .map((_, index) => (
              <Card key={index} style={{ margin: 20, width: "80%", minWidth: "360px" }}>
                <Skeleton
                  active
                  title={{ width: "40%" }}
                  paragraph={{ rows: 2 }}
                />
                <Divider />
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    margin: 30,
                  }}
                >
                </div>
              </Card>
            ))}
        </div>
      ) : forms.length > 0 ? (
        <div
          style={{
            alignItems: "center",
            display: "flex",
            flexDirection: "column",
            marginLeft: "10%",
            marginRight: "10%",
            width: "80%",
          }}
        >
          {forms.map((f: Event) => {
            return <PublicFormCard key={f.id} event={f} />;
          })}
        </div>
      ) : (
        <Typography.Text
          style={{ display: "block", textAlign: "center", margin: "40px" }}
        >
          No public forms found on the connected relays.
        </Typography.Text>
      )}
    </StyleWrapper>
  );
}

export default PublicForms;
