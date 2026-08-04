import React from "react";
import { Card, CardContent, Typography } from "@mui/material";
import { FormTemplate } from "../../templates";

interface TemplateCardProps {
  template: FormTemplate;
  onClick: (template: FormTemplate) => void;
}

const TemplateCard: React.FC<TemplateCardProps> = ({ template, onClick }) => {
  return (
    <Card
      variant="outlined"
      onClick={() => onClick(template)}
      sx={{
        // Desktop (sm+) keeps the original fixed 180x120 card with its own
        // margin. Mobile fills the 2-col grid cell and auto-heights so a
        // wrapped title + 2-line description never clips.
        width: { xs: "100%", sm: 180 },
        height: { xs: "auto", sm: 120 },
        minHeight: { xs: 100, sm: 120 },
        m: { xs: 0, sm: 1 },
        cursor: "pointer",
        transition: "border-color 0.2s ease-in-out",
        "&:hover": { borderColor: "primary.main" },
      }}
    >
      <CardContent
        sx={{
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          textAlign: "center",
        }}
      >
        <Typography sx={{ fontWeight: 600 }}>{template.name}</Typography>
        {template.description && (
          <Typography
            variant="body2"
            sx={{
              mt: 0.5,
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
            }}
          >
            {template.description}
          </Typography>
        )}
      </CardContent>
    </Card>
  );
};

export default TemplateCard;
