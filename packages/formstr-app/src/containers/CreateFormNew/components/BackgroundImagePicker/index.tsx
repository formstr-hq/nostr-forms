import React from "react";
import { Box, Card, CardMedia, IconButton } from "@mui/material";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";

interface ImagePickerProps {
  options: string[];
  selectedUrl?: string;
  onSelect: (url: string) => void;
}

/**
 * MUI replacement for the antd Carousel picker (ui-rewrite-mui Phase 5):
 * horizontal scroll-snap pages — no carousel dependency.
 */
export const ImagePicker: React.FC<ImagePickerProps> = ({
  options,
  selectedUrl,
  onSelect,
}) => {
  const scrollRef = React.useRef<HTMLDivElement>(null);

  // break images into groups depending on screen size
  const chunkSize = window.innerWidth > 768 ? 5 : 3;
  const slides: string[][] = [];
  for (let i = 0; i < options.length; i += chunkSize) {
    slides.push(options.slice(i, i + chunkSize));
  }

  const scrollByPage = (direction: -1 | 1) => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollBy({ left: direction * el.clientWidth, behavior: "smooth" });
  };

  const arrowSx = {
    position: "absolute",
    top: "40%",
    zIndex: 10,
    bgcolor: "rgba(255, 255, 255, 0.8)",
    boxShadow: "0 1px 4px rgba(0, 0, 0, 0.15)",
    "&:hover": { bgcolor: "rgba(255, 255, 255, 0.95)" },
  } as const;

  return (
    <Box sx={{ position: "relative", width: "100%" }}>
      <IconButton
        aria-label="previous backgrounds"
        size="small"
        onClick={() => scrollByPage(-1)}
        sx={{ ...arrowSx, left: 4 }}
      >
        <ChevronLeftIcon />
      </IconButton>
      <IconButton
        aria-label="next backgrounds"
        size="small"
        onClick={() => scrollByPage(1)}
        sx={{ ...arrowSx, right: 4 }}
      >
        <ChevronRightIcon />
      </IconButton>

      <Box
        ref={scrollRef}
        sx={{
          display: "flex",
          overflowX: "auto",
          scrollSnapType: "x mandatory",
          scrollbarWidth: "none",
          "&::-webkit-scrollbar": { display: "none" },
          width: "100%",
        }}
      >
        {slides.map((group, idx) => (
          <Box
            key={idx}
            sx={{
              display: "flex",
              gap: "12px",
              p: "8px",
              flex: "0 0 100%",
              scrollSnapAlign: "start",
            }}
          >
            {group.map((url) => (
              <Card
                key={url}
                variant="outlined"
                onClick={() => onSelect(url)}
                sx={{
                  cursor: "pointer",
                  flex: 1,
                  border: "2px solid",
                  borderColor:
                    url === selectedUrl ? "primary.main" : "transparent",
                  transition: "border-color 0.2s ease",
                }}
              >
                <CardMedia
                  component="img"
                  image={url}
                  alt="background option"
                  sx={{ height: 120, objectFit: "cover", borderRadius: "6px" }}
                />
              </Card>
            ))}
          </Box>
        ))}
      </Box>
    </Box>
  );
};
