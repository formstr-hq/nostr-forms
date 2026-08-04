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
        width: "100%",
        // Auto-height on mobile so a wrapped title + 2-line description never
        // clips; a shared minHeight keeps the grid rows visually even.
        height: { xs: "auto", sm: 120 },
        minHeight: { xs: 100, sm: 120 },
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
          p: { xs: 1.5, sm: 2 },
          "&:last-child": { pb: { xs: 1.5, sm: 2 } },
        }}
      >
        <Typography sx={{ fontWeight: 600, fontSize: { xs: "1rem", sm: "1.125rem" } }}>
          {template.name}
        </Typography>
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
