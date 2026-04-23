import React from 'react';
import { Typography, Collapse } from 'antd';
import './style.css';
import { useTranslation } from "react-i18next";

const { Panel } = Collapse;

const OllamaSettings: React.FC = () => {
    const { t } = useTranslation();
    return (
        <Collapse ghost>
            <Panel header={t("ollama.helpTitle")} key="1">
                <Typography.Title level={5} className="settings-title">
                    {t("ollama.step1Title")}
                </Typography.Title>
                <Typography.Paragraph className="settings-paragraph">
                    {t("ollama.step1Intro")}{" "}
                    <a href="https://github.com/ashu01304/Ollama_Web" target="_blank" rel="noopener noreferrer">
                    {t("ollama.companionExtension")}
                    </a>{" "}
                    {t("ollama.step1Outro")}
                </Typography.Paragraph>

                <Typography.Title level={5} className="settings-title">
                    {t("ollama.step2Title")}
                </Typography.Title>
                <Typography.Paragraph className="settings-paragraph-tight">
                    {t("ollama.step2Intro")}
                    <ol className="settings-list">
                        <li>{t("ollama.allowedDomains1")}</li>
                        <li>{t("ollama.allowedDomains2")}</li>
                        <li>{t("ollama.allowedDomains3")}</li>
                    </ol>
                </Typography.Paragraph>
                 <Typography.Paragraph strong className="settings-final-paragraph">
                    {t("ollama.finalHint")}
                </Typography.Paragraph>
            </Panel>
        </Collapse>
    );
};

export default OllamaSettings;
