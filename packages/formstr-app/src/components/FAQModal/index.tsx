// src/components/FAQModal.tsx
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

interface FAQModalProps {
  visible: boolean;
  onClose: () => void;
}

interface FAQItem {
  question: string;
  answer: string;
}

const FAQModal: React.FC<FAQModalProps> = ({ visible, onClose }) => {
  const [faqItems, setFaqItems] = useState<FAQItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchFAQContent = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch("/docs/faq.md");
        if (!response.ok) {
          throw new Error(`Failed to fetch FAQ content: ${response.status}`);
        }
        const text = await response.text();

        const lines = text.split("\n");
        const items: FAQItem[] = [];
        let currentQuestion = "";
        let currentAnswer = "";

        lines.forEach((line) => {
          if (line.startsWith("## ")) {
            if (currentQuestion) {
              items.push({
                question: currentQuestion,
                answer: currentAnswer.trim(),
              });
            }
            currentQuestion = line.replace("## ", "").trim();
            currentAnswer = "";
          } else if (currentQuestion) {
            currentAnswer += line + "\n";
          }
        });

        if (currentQuestion && currentAnswer) {
          items.push({
            question: currentQuestion,
            answer: currentAnswer.trim(),
          });
        }

        setFaqItems(items);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "An unknown error occurred"
        );
      } finally {
        setLoading(false);
      }
    };

    fetchFAQContent();
  }, []);

  return (
    <Dialog open={visible} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Typography variant="h3" component="span" color="primary">
          Frequently Asked Questions
        </Typography>
      </DialogTitle>
      <DialogContent>
        <Box
          sx={{
            p: 3,
            background: (theme) => theme.palette.action.hover,
            borderRadius: 3,
            minHeight: 250,
          }}
        >
          {loading && (
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 1,
                py: 4,
              }}
            >
              <CircularProgress size={24} />
              <Typography>Loading FAQ...</Typography>
            </Box>
          )}

          {!loading && error && (
            <Box sx={{ p: 2, bgcolor: "error.light", borderRadius: 2 }}>
              <Typography variant="h6" color="error">
                Oops, Something Went Wrong
              </Typography>
              <Typography color="error">{`Failed to load FAQ: ${error}`}</Typography>
            </Box>
          )}

          {!loading && !error && faqItems.length === 0 && (
            <Box sx={{ p: 2, bgcolor: "warning.light", borderRadius: 2 }}>
              <Typography variant="h6" color="warning.dark">
                No FAQ Content Found
              </Typography>
              <Typography color="warning.dark">
                The FAQ file appears to be empty or incorrectly formatted.
              </Typography>
            </Box>
          )}

          {!loading && !error && faqItems.length > 0 && (
            <>
              {faqItems.map((item, index) => (
                <Accordion
                  key={String(index + 1)}
                  defaultExpanded={index === 0}
                  disableGutters
                  sx={{
                    mb: 1.5,
                    borderRadius: 1.5,
                    "&:before": { display: "none" },
                  }}
                >
                  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Typography color="primary" sx={{ fontWeight: 500 }}>
                      {item.question}
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
                        a: ({ node, ...props }) => (
                          <a {...props} target="_blank" rel="noopener noreferrer">
                            {props.children}
                          </a>
                        ),
                      }}
                    >
                      {item.answer}
                    </SafeMarkdown>
                  </AccordionDetails>
                </Accordion>
              ))}
            </>
          )}
        </Box>
      </DialogContent>
    </Dialog>
  );
};

export default FAQModal;
