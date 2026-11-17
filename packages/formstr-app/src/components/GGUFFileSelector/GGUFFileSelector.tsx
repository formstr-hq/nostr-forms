import React, { useState } from "react";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  IconButton,
  Link,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import SearchIcon from "@mui/icons-material/Search";
import UploadFileIcon from "@mui/icons-material/UploadFile";

interface GGUFFileSelectorProps {
  onFileSelected: (file: File) => Promise<void>;
  loading?: boolean;
  selectedFileName?: string;
  placeholder?: string;
}

const RECOMMENDED_MODELS = [
  {
    name: "SmolLM2 360M Instruct",
    badge: "Smallest",
    size: "386 MB",
    description:
      "The lightest option for lower-memory phones. It loads faster, but its suggestions may be less accurate.",
    downloadUrl:
      "https://huggingface.co/unsloth/SmolLM2-360M-Instruct-GGUF/resolve/main/SmolLM2-360M-Instruct-Q8_0.gguf?download=true",
    detailsUrl: "https://huggingface.co/unsloth/SmolLM2-360M-Instruct-GGUF",
  },
  {
    name: "Qwen2.5 0.5B Instruct",
    badge: "Recommended",
    size: "491 MB",
    description:
      "A good speed and quality balance for text suggestions on most recent phones and computers.",
    downloadUrl:
      "https://huggingface.co/Qwen/Qwen2.5-0.5B-Instruct-GGUF/resolve/main/qwen2.5-0.5b-instruct-q4_k_m.gguf?download=true",
    detailsUrl: "https://huggingface.co/Qwen/Qwen2.5-0.5B-Instruct-GGUF",
  },
  {
    name: "Qwen2.5 1.5B Instruct",
    badge: "Better quality",
    size: "1.12 GB",
    description:
      "A larger, slower model for stronger suggestions. Best on desktops and higher-memory phones.",
    downloadUrl:
      "https://huggingface.co/Qwen/Qwen2.5-1.5B-Instruct-GGUF/resolve/main/qwen2.5-1.5b-instruct-q4_k_m.gguf?download=true",
    detailsUrl: "https://huggingface.co/Qwen/Qwen2.5-1.5B-Instruct-GGUF",
  },
] as const;

const GGUFFileSelector: React.FC<GGUFFileSelectorProps> = ({
  onFileSelected,
  loading = false,
  selectedFileName,
  placeholder = "Select a GGUF file from your storage",
}) => {
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [modelSearch, setModelSearch] = useState("");

  const modelSearchUrl =
    "https://huggingface.co/models?pipeline_tag=text-generation&library=gguf&search=" +
    encodeURIComponent(modelSearch.trim());

  const handleFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    if (!file.name.toLowerCase().endsWith(".gguf")) {
      setErrorMessage("Please select a valid GGUF file (*.gguf)");
      event.target.value = "";
      return;
    }

    const maxSize = 10 * 1024 * 1024 * 1024;
    if (file.size > maxSize) {
      setErrorMessage("File size exceeds 10GB limit");
      event.target.value = "";
      return;
    }

    setErrorMessage(null);

    try {
      await onFileSelected(file);
    } catch (error: any) {
      setErrorMessage(error?.message || "Failed to load model");
    } finally {
      event.target.value = "";
    }
  };

  return (
    <Box sx={{ width: "100%" }}>
      <input
        type="file"
        accept=".gguf"
        style={{ display: "none" }}
        onChange={handleFileChange}
        disabled={loading}
      />
      <Button
        variant="contained"
        component="label"
        disabled={loading}
        startIcon={<UploadFileIcon />}
        sx={{ width: "100%", justifyContent: "flex-start" }}
      >
        {loading ? (
          <>
            <CircularProgress size={18} color="inherit" sx={{ mr: 1 }} />
            Loading Model...
          </>
        ) : (
          "Choose GGUF File"
        )}
        <input
          type="file"
          accept=".gguf"
          hidden
          onChange={handleFileChange}
          disabled={loading}
        />
      </Button>

      {selectedFileName && !loading && (
        <Typography color="success.main" sx={{ mt: 1, display: "block" }}>
          ✓ Loaded: {selectedFileName}
        </Typography>
      )}

      {errorMessage && (
        <Typography color="error" sx={{ mt: 1, display: "block" }}>
          {errorMessage}
        </Typography>
      )}

      <Typography
        color="text.secondary"
        sx={{ mt: 1, display: "block", fontSize: 12 }}
      >
        {placeholder}
      </Typography>

      <Accordion
        disableGutters
        elevation={0}
        sx={{
          mt: 1.5,
          border: 1,
          borderColor: "divider",
          borderRadius: 2,
          overflow: "hidden",
          "&:before": { display: "none" },
          "&.Mui-expanded": { mt: 1.5 },
        }}
      >
        <AccordionSummary
          expandIcon={<ExpandMoreIcon />}
          sx={{
            px: { xs: 1.5, sm: 2 },
            "&.Mui-expanded": { minHeight: 48 },
            "& .MuiAccordionSummary-content": { my: 1.25 },
            "& .MuiAccordionSummary-content.Mui-expanded": { my: 1.25 },
          }}
        >
          <Box>
            <Typography sx={{ fontWeight: 600 }}>Get a model</Typography>
            <Typography variant="body2">
              Browse recommendations or search Hugging Face
            </Typography>
          </Box>
        </AccordionSummary>

        <AccordionDetails sx={{ px: { xs: 1.5, sm: 2 }, pt: 0, pb: 2 }}>
          <Alert severity="info" sx={{ mb: 2 }}>
            Download a model, return here, then use Choose GGUF File above.
          </Alert>

          <Stack spacing={1.5}>
            {RECOMMENDED_MODELS.map((model) => (
              <Box
                key={model.name}
                sx={{
                  border: 1,
                  borderColor: "divider",
                  borderRadius: 2,
                  p: { xs: 1.5, sm: 2 },
                }}
              >
                <Stack
                  direction="row"
                  spacing={1}
                  useFlexGap
                  sx={{ alignItems: "center", flexWrap: "wrap", mb: 0.75 }}
                >
                  <Typography sx={{ fontWeight: 600 }}>{model.name}</Typography>
                  <Chip label={model.badge} size="small" />
                  <Typography variant="body2">{model.size}</Typography>
                </Stack>

                <Typography variant="body2" sx={{ mb: 1.25 }}>
                  {model.description}
                </Typography>

                <Stack
                  direction="row"
                  spacing={2}
                  useFlexGap
                  sx={{ alignItems: "center", flexWrap: "wrap" }}
                >
                  <Button
                    component="a"
                    href={model.downloadUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    variant="outlined"
                    size="small"
                    aria-label={`Download GGUF for ${model.name}`}
                  >
                    Download GGUF
                  </Button>
                  <Link
                    href={model.detailsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    underline="hover"
                    aria-label={`Model details for ${model.name}`}
                  >
                    Model details
                  </Link>
                </Stack>
              </Box>
            ))}

            <Box
              sx={{
                border: 1,
                borderColor: "divider",
                borderRadius: 2,
                p: { xs: 1.5, sm: 2 },
              }}
            >
              <Typography sx={{ fontWeight: 600, mb: 0.75 }}>
                Want a different model?
              </Typography>
              <Typography variant="body2" sx={{ mb: 1.25 }}>
                Search the Hugging Face catalog. For this editor, choose a
                single-file text-generation Instruct or Chat GGUF; Q4_K_M is a
                good starting point.
              </Typography>
              <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
                <TextField
                  value={modelSearch}
                  onChange={(event) => setModelSearch(event.target.value)}
                  placeholder="Search other GGUF models"
                  slotProps={{
                    htmlInput: { "aria-label": "Search Hugging Face models" },
                  }}
                  size="small"
                  fullWidth
                />
                <Tooltip title="Search Hugging Face">
                  <IconButton
                    component="a"
                    href={modelSearchUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    color="primary"
                    aria-label="Search Hugging Face models"
                    sx={{
                      flexShrink: 0,
                      border: 1,
                      borderColor: "primary.main",
                      borderRadius: 1,
                    }}
                  >
                    <SearchIcon />
                  </IconButton>
                </Tooltip>
              </Stack>
            </Box>
          </Stack>

          <Typography variant="body2" sx={{ mt: 2 }}>
            Choose any compatible GGUF. The three models above are
            recommendations, not a restriction.
          </Typography>
        </AccordionDetails>
      </Accordion>
    </Box>
  );
};

export default GGUFFileSelector;
