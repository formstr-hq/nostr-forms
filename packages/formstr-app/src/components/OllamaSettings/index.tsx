import React from 'react';
import {
    Accordion,
    AccordionDetails,
    AccordionSummary,
    Typography,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import './style.css';
import { useTranslation } from "react-i18next";

const OllamaSettings: React.FC = () => {
    const { t } = useTranslation();
    return (
        <Accordion disableGutters elevation={0} sx={{ background: "transparent", "&:before": { display: "none" } }}>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                {t("ollama.helpTitle")}
            </AccordionSummary>
            <AccordionDetails>
                <Typography variant="h6" className="settings-title">
                    {t("ollama.step1Title")}
                </Typography>
                <Typography component="p" className="settings-paragraph">
                    {t("ollama.step1Intro")}{" "}
                    <a href="https://github.com/ashu01304/Ollama_Web" target="_blank" rel="noopener noreferrer">
                    {t("ollama.companionExtension")}
                    </a>{" "}
                    {t("ollama.step1Outro")}
                </Typography>

                <Typography variant="h6" className="settings-title">
                    {t("ollama.step2Title")}
                </Typography>
                <Typography component="div" className="settings-paragraph-tight">
                    {t("ollama.step2Intro")}
                    <ol className="settings-list">
                        <li>{t("ollama.allowedDomains1")}</li>
                        <li>{t("ollama.allowedDomains2")}</li>
                        <li>{t("ollama.allowedDomains3")}</li>
                    </ol>
                </Typography>
                 <Typography component="p" className="settings-final-paragraph" sx={{ fontWeight: 600 }}>
                    {t("ollama.finalHint")}
                </Typography>
            </AccordionDetails>
        </Accordion>
    );
};

export default OllamaSettings;
