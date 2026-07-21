// src/components/UniversalMarkdownModal.tsx
import { useEffect, useState } from "react";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  CircularProgress,
  Dialog,
  DialogContent,
  DialogTitle,
  Typography,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import SafeMarkdown from "../SafeMarkdown";

interface Props {
  visible: boolean;
  onClose: () => void;
  filePath: string; // e.g. "/docs/faq.md"
  title: string; // e.g. "FAQ" or "Terms & Privacy"
}

interface Section {
  heading: string;
  body: string;
}

const UniversalMarkdownModal: React.FC<Props> = ({
  visible,
  onClose,
  filePath,
  title,
}) => {
  const [rawContent, setRawContent] = useState("");
  const [sections, setSections] = useState<Section[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchContent = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(filePath);
        if (!response.ok)
          throw new Error(`Failed to fetch: ${response.status}`);
        const text = await response.text();
        setRawContent(text);

        const lines = text.split("\n");
        const items: Section[] = [];
        let currentHeading = "";
        let currentBody = "";

        lines.forEach((line) => {
          if (line.startsWith("## ")) {
            if (currentHeading) {
              items.push({
                heading: currentHeading,
                body: currentBody.trim(),
              });
            }
            currentHeading = line.replace("## ", "").trim();
            currentBody = "";
          } else if (currentHeading) {
            currentBody += line + "\n";
          }
        });

        if (currentHeading && currentBody) {
          items.push({ heading: currentHeading, body: currentBody.trim() });
        }

        setSections(items);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setLoading(false);
      }
    };

    fetchContent();
  }, [filePath]);

  const isCollapsible = sections.length > 0;

  return (
    <Dialog open={visible} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Typography variant="h3" component="span" color="primary">
          {title}
        </Typography>
      </DialogTitle>
      <DialogContent>
        <Box
          sx={{
            p: 3,
            background: (theme) => theme.palette.action.hover,
            borderRadius: 3,
          }}
        >
          {loading ? (
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <CircularProgress size={20} />
              <Typography>Loading...</Typography>
            </Box>
          ) : error ? (
            <Typography color="error">{error}</Typography>
          ) : isCollapsible ? (
            sections.map((item, idx) => (
              <Accordion
                key={String(idx)}
                defaultExpanded={idx === 0}
                disableGutters
                sx={{ mb: 1.5, borderRadius: 1.5, "&:before": { display: "none" } }}
              >
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Typography color="primary" sx={{ fontWeight: 500 }}>
                    {item.heading}
                  </Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <SafeMarkdown
                    components={{
                      p: ({ children }) => (
                        <Typography color="text.secondary" sx={{ mb: 2 }}>
                          {children}
                        </Typography>
                      ),
                      a: (props) => (
                        <a {...props} target="_blank" rel="noopener noreferrer">
                          {props.children}
                        </a>
                      ),
                    }}
                  >
                    {item.body}
                  </SafeMarkdown>
                </AccordionDetails>
              </Accordion>
            ))
          ) : (
            <SafeMarkdown>{rawContent}</SafeMarkdown>
          )}
        </Box>
      </DialogContent>
    </Dialog>
  );
};

export default UniversalMarkdownModal;
