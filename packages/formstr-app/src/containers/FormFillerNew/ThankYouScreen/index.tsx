import { Dialog } from "@mui/material";
import ThankYouStyle from "./thankyou.style";
import { Event } from "nostr-tools";
import { IFormSettings } from "../../CreateFormNew/components/FormSettings/types";
import { useState, useEffect } from "react";
import { getFormSpec } from "../../../utils/formUtils";
import { useProfileContext } from "../../../hooks/useProfileContext";

export const ThankYouScreen = ({
  formEvent,
  isOpen,
  onClose,
  viewKey,
}: {
  formEvent: Event;
  isOpen: boolean;
  onClose: () => void;
  viewKey: string | null;
}) => {
  const { pubkey: userPubKey } = useProfileContext();
  const [settings, setSettings] = useState<IFormSettings>();

  useEffect(() => {
    const initialize = async () => {
      if (formEvent.content === "") {
        const settingsTag = formEvent.tags.find((tag) => tag[0] === "settings");
        if (settingsTag) {
          const parsedSettings = JSON.parse(
            settingsTag[1] || "{}"
          ) as IFormSettings;
          setSettings(parsedSettings);
        }
        return;
      }

      const formSpec = await getFormSpec(
        formEvent,
        userPubKey,
        () => {},
        viewKey
      );
      if (formSpec) {
        const settings = JSON.parse(
          formSpec.find((tag) => tag[0] === "settings")?.[1] || "{}"
        ) as IFormSettings;
        setSettings(settings);
      }
    };
    initialize();
  }, []);
  return (
    <Dialog open={isOpen} onClose={onClose}>
      <ThankYouStyle>
        <div
          className="thank-you-image-container"
          style={{ marginTop: "20px" }}
        >
          <img
            src={
              settings?.thankYouScreenImageUrl ||
              "https://image.nostr.build/ab238249194e61952d5d199f9595c88da1ba6b1e3d981232e9dc4821a19908fe.gif"
            }
            className="thank-you-image"
            alt="Thank you"
          />
        </div>
      </ThankYouStyle>
    </Dialog>
  );
};
