import { Typography } from "@mui/material";
import StyleWrapper from "./style";
import SafeMarkdown from "../SafeMarkdown";

function FormBanner({
  imageUrl,
  formTitle,
  globalColor,
  titleColor,
}: {
  imageUrl?: string;
  formTitle: string;
  globalColor?: string;
  titleColor?: string;
}) {
  const settings = {
    name: formTitle,
    image: imageUrl,
    globalColor,
  };

  return (
    <StyleWrapper className="form-title" $titleImageUrl={settings.image}>
      <Typography
        component="span"
        className="title-text"
        sx={{ color: titleColor || globalColor || "black" }}
      >
        <SafeMarkdown>{settings.name}</SafeMarkdown>
      </Typography>
    </StyleWrapper>
  );
}

export default FormBanner;
