import { useState, useCallback } from "react";

export interface FetchResult {
  success: boolean;
  data?: {
    title?: string;
    description?: string;
    id?: string;
    questions?: GoogleFormQuestion[];
  };
  error?: string;
}

export interface GoogleFormQuestion {
  id: number;
  title: string;
  type: string;
  helpText?: string;
  isRequired?: boolean;
  options?: string[];
  hasOtherOption?: boolean;
  rows?: string[];
  columns?: string[];
  allowedFileTypes?: string[];
  maxFiles?: number;
  maxFileSizeBytes?: number;
}

type ToastType = "success" | "error" | "warning" | "";

interface ToastState {
  msg: string;
  type: ToastType;
}

export interface GoogleFormsDeployerProps {
  onFetch?: (data: FetchResult) => void;
  onRenderInBuilder?: (data: FetchResult) => void;
}

const buildScript = (formId: string): string => `function doGet(e) {
  const FORM_ID = "${formId || "YOUR_FORM_ID_HERE"}";

  try {
    const form = FormApp.openById(FORM_ID);
    const items = form.getItems();

    const formData = {
      title: form.getTitle(),
      description: form.getDescription(),
      id: FORM_ID,
      questions: items.map(item => {
        const base = {
          id: item.getId(),
          title: item.getTitle(),
          type: item.getType().toString(),
          helpText: item.getHelpText(),
          isRequired: false
        };
        switch (item.getType()) {
          case FormApp.ItemType.MULTIPLE_CHOICE: {
            const mc = item.asMultipleChoiceItem();
            return { ...base, isRequired: mc.isRequired(),
              options: mc.getChoices().map(c => c.getValue()),
              hasOtherOption: mc.hasOtherOption() };
          }
          case FormApp.ItemType.CHECKBOX: {
            const cb = item.asCheckboxItem();
            return { ...base, isRequired: cb.isRequired(),
              options: cb.getChoices().map(c => c.getValue()),
              hasOtherOption: cb.hasOtherOption() };
          }
          case FormApp.ItemType.LIST: {
            const li = item.asListItem();
            return { ...base, isRequired: li.isRequired(),
              options: li.getChoices().map(c => c.getValue()) };
          }
          case FormApp.ItemType.TEXT: {
            return { ...base, isRequired: item.asTextItem().isRequired() };
          }
          case FormApp.ItemType.PARAGRAPH_TEXT: {
            return { ...base, isRequired: item.asParagraphTextItem().isRequired() };
          }
          case FormApp.ItemType.SCALE: {
            const sc = item.asScaleItem();
            return { ...base, isRequired: sc.isRequired(),
              lowerBound: sc.getLowerBound(), upperBound: sc.getUpperBound(),
              leftLabel: sc.getLeftLabel(), rightLabel: sc.getRightLabel() };
          }
          case FormApp.ItemType.DATE: {
            const di = item.asDateItem();
            return { 
              ...base, 
              isRequired: di.isRequired(),
              typeMeta: "date-only"
            };
          }
          case FormApp.ItemType.TIME: {
            return { ...base, isRequired: item.asTimeItem().isRequired() };
          }
          case FormApp.ItemType.DATETIME: {
            const dti = item.asDateTimeItem();
            return { ...base, isRequired: dti.isRequired(),
              includesYear: dti.getIncludesYear() };
          }
          case FormApp.ItemType.DURATION: {
            return { ...base, isRequired: item.asDurationItem().isRequired() };
          }
          case FormApp.ItemType.FILE_UPLOAD: {
            return base;
          }
          case FormApp.ItemType.GRID: {
            const gr = item.asGridItem();
            return { 
              ...base, 
              isRequired: gr.isRequired(),
              rows: gr.getRows(), 
              columns: gr.getColumns()
            };
          }
          case FormApp.ItemType.CHECKBOX_GRID: {
            const cg = item.asCheckboxGridItem();
            return { 
              ...base, 
              isRequired: cg.isRequired(),
              rows: cg.getRows(), 
              columns: cg.getColumns()
            };
          }
          case FormApp.ItemType.PAGE_BREAK: {
            const pb = item.asPageBreakItem();
            return { ...base,
              goToPage: pb.getGoToPage() ? pb.getGoToPage().getId() : null,
              pageNavigationType: pb.getPageNavigationType().toString() };
          }
          case FormApp.ItemType.SECTION_HEADER:
            return base;
          default:
            return base;
        }
      })
    };

    return ContentService
      .createTextOutput(JSON.stringify({ success: true, data: formData }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ success: false, error: err.message }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}`;


function CopyIcon() {
  return (
    <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <rect x={9} y={9} width={13} height={13} rx={2} />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  );
}

function BoltIcon() {
  return (
    <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function SpinnerIcon() {
  return (
    <svg
      width={14}
      height={14}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      style={{ animation: "gfd-spin 0.75s linear infinite" }}
    >
      <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
    </svg>
  );
}

interface StepProps {
  num: number;
  title: string;
  children: React.ReactNode;
}

function Step({ num, title, children }: StepProps) {
  return (
    <div style={{ display: "flex", gap: 12, paddingBottom: 24 }}>
      <div style={{
        width: 26, height: 26, minWidth: 26, borderRadius: "50%",
        border: "1px solid #e2e8f0", display: "flex", alignItems: "center",
        justifyContent: "center", fontSize: 12, fontWeight: 500,
        color: "#64748b", background: "#f8fafc", marginTop: 1, flexShrink: 0,
      }}>
        {num}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 8, color: "#0f172a" }}>
          {title}
        </div>
        {children}
      </div>
    </div>
  );
}

interface ToastProps {
  msg: string;
  type: ToastType;
}

function Toast({ msg, type }: ToastProps) {
  if (!msg) return null;
  const styles: Record<string, React.CSSProperties> = {
    success: { background: "#f0fdf4", color: "#166534", borderColor: "#bbf7d0" },
    error:   { background: "#fef2f2", color: "#991b1b", borderColor: "#fecaca" },
    warning: { background: "#fffbeb", color: "#92400e", borderColor: "#fde68a" },
    "":      { background: "#f8fafc", color: "#334155", borderColor: "#e2e8f0" },
  };
  return (
    <div style={{
      padding: "8px 14px", borderRadius: 8, fontSize: 13,
      border: "1px solid", marginBottom: 16,
      ...styles[type],
    }}>
      {msg}
    </div>
  );
}

interface CodeBlockProps {
  code: string;
}

function CodeBlock({ code }: CodeBlockProps) {
  return (
    <pre style={{
      background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 8,
      padding: "10px 12px", fontSize: 11, fontFamily: "monospace",
      whiteSpace: "pre", overflowX: "auto", overflowY: "auto",
      maxHeight: 120, lineHeight: 1.6, margin: 0, color: "#334155",
    }}>
      {code}
    </pre>
  );
}

export default function GoogleFormsDeployer({
  onFetch,
  onRenderInBuilder,
}: GoogleFormsDeployerProps) {
  const [formId, setFormId]           = useState<string>("");
  const [deployUrl, setDeployUrl]     = useState<string>("");
  const [fetching, setFetching]       = useState<boolean>(false);
  const [fetchResult, setFetchResult] = useState<FetchResult | null>(null);
  const [toast, setToast]             = useState<ToastState>({ msg: "", type: "" });

  const showToast = (msg: string, type: ToastType) => {
    setToast({ msg, type });
    setTimeout(() => setToast({ msg: "", type: "" }), 3000);
  };

  const script = buildScript(formId);

  const handleCopyScript = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(script);
      showToast("Script copied to clipboard", "success");
    } catch {
      showToast("Copy failed — select and copy manually", "error");
    }
  }, [script]);

  const handleCopyJson = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(JSON.stringify(fetchResult, null, 2));
      showToast("JSON copied", "success");
    } catch {
      showToast("Copy failed", "error");
    }
  }, [fetchResult]);

  const handleFetch = useCallback(async () => {
    if (!deployUrl.trim()) {
      showToast("Please enter a deployment URL", "warning");
      return;
    }
    setFetching(true);
    setFetchResult(null);
    try {
      const res = await fetch(deployUrl.trim());
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data: FetchResult = await res.json();
      setFetchResult(data);
      onFetch?.(data);
      if (data.success) {
        const q = Array.isArray(data.data?.questions) ? data.data!.questions.length : "?";
        showToast(`Fetched — ${q} question${q !== 1 ? "s" : ""} found`, "success");
      } else {
        showToast(`Script error: ${data.error}`, "error");
      }
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : "Unknown error";
      showToast(`Fetch failed: ${errMsg}`, "error");
      setFetchResult({ success: false, error: errMsg });
    } finally {
      setFetching(false);
    }
  }, [deployUrl, onFetch]);

  const inputStyle: React.CSSProperties = {
    width: "100%", padding: "7px 10px",
    border: "1px solid #e2e8f0", borderRadius: 8,
    fontSize: 13, fontFamily: "monospace",
    background: "#fff", color: "#0f172a", outline: "none",
    boxSizing: "border-box",
  };

  const btnBase: React.CSSProperties = {
    display: "inline-flex", alignItems: "center", gap: 6,
    padding: "7px 12px", border: "1px solid #e2e8f0", borderRadius: 8,
    fontSize: 13, cursor: "pointer", background: "#fff",
    color: "#334155", fontFamily: "inherit", whiteSpace: "nowrap",
  };

  const btnPrimary: React.CSSProperties = {
    ...btnBase,
    background: "#0f172a", color: "#fff",
    borderColor: "#0f172a",
    opacity: fetching ? 0.5 : 1,
    cursor: fetching ? "not-allowed" : "pointer",
  };

  return (
    <>
      {/* Keyframe for spinner — injected once */}
      <style>{`@keyframes gfd-spin { to { transform: rotate(360deg); } }`}</style>

      <div style={{ fontFamily: "system-ui, -apple-system, sans-serif", padding: "4px 0" }}>
        <Toast msg={toast.msg} type={toast.type} />

        {/* Step 1 */}
        <Step num={1} title="Enter Form ID">
          <p style={{ fontSize: 13, color: "#64748b", marginBottom: 8, lineHeight: 1.6 }}>
            Found in your form URL:{" "}
            <code style={{ fontSize: 11, background: "#f1f5f9", padding: "1px 5px", borderRadius: 4, border: "1px solid #e2e8f0" }}>
              docs.google.com/forms/d/<strong>FORM_ID</strong>/edit
            </code>
          </p>
          <input
            type="text"
            placeholder="e.g. 1M3sMTtLrAhXMH..."
            value={formId}
            onChange={(e) => setFormId(e.target.value)}
            style={inputStyle}
          />
        </Step>

        {/* Step 2 */}
        <Step num={2} title="Copy the script">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
            <span style={{
              display: "inline-flex", alignItems: "center", gap: 4,
              padding: "2px 8px", borderRadius: 6, fontSize: 11,
              fontFamily: "monospace", border: "1px solid #e2e8f0",
              background: "#f8fafc", color: "#64748b",
            }}>
              Apps Script · doGet.gs
            </span>
            <button style={btnBase} onClick={handleCopyScript}>
              <CopyIcon /> Copy script
            </button>
          </div>
          <CodeBlock code={script} />
        </Step>

        {/* Step 3 */}
        <Step num={3} title="Create & deploy">
          <ol style={{ paddingLeft: 16, margin: 0 }}>
            {[
              <>Go to <a href="https://script.google.com" target="_blank" rel="noreferrer" style={{ color: "#2563eb" }}>script.google.com</a> → <strong>New project</strong></>,
              <>Delete default code, paste the script, save (Ctrl+S)</>,
              <>Click <strong>Deploy → New deployment</strong> → type <code style={{ fontSize: 11, background: "#f1f5f9", padding: "1px 5px", borderRadius: 4, border: "1px solid #e2e8f0" }}>Web app</code></>,
              <>Set <em>Execute as</em>: <code style={{ fontSize: 11, background: "#f1f5f9", padding: "1px 5px", borderRadius: 4, border: "1px solid #e2e8f0" }}>Me</code> · <em>Access</em>: <code style={{ fontSize: 11, background: "#f1f5f9", padding: "1px 5px", borderRadius: 4, border: "1px solid #e2e8f0" }}>Anyone</code> → <strong>Deploy</strong> &amp; authorize</>,
              <>Copy the generated Web app URL</>,
            ].map((item, i) => (
              <li key={i} style={{ fontSize: 13, color: "#475569", lineHeight: 2 }}>{item}</li>
            ))}
          </ol>
        </Step>

        {/* Step 4 */}
        <Step num={4} title="Fetch form schema">
          <div style={{ display: "flex", gap: 0, marginBottom: fetchResult ? 12 : 0 }}>
            <input
              type="text"
              placeholder="https://script.google.com/macros/s/.../exec"
              value={deployUrl}
              onChange={(e) => setDeployUrl(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleFetch()}
              style={{ ...inputStyle, borderRadius: "8px 0 0 8px", borderRight: "none" }}
            />
            <button style={{ ...btnPrimary, borderRadius: "0 8px 8px 0" }} onClick={handleFetch} disabled={fetching}>
              {fetching ? <SpinnerIcon /> : <BoltIcon />}
              {fetching ? "Fetching…" : "Fetch"}
            </button>
          </div>

          {fetchResult && (
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{
                    display: "inline-flex", alignItems: "center", gap: 4,
                    padding: "2px 8px", borderRadius: 6, fontSize: 11,
                    fontFamily: "monospace",
                    ...(fetchResult.success
                      ? { background: "#f0fdf4", color: "#166534", border: "1px solid #bbf7d0" }
                      : { background: "#fef2f2", color: "#991b1b", border: "1px solid #fecaca" }),
                  }}>
                    {fetchResult.success && <CheckIcon />}
                    {fetchResult.success ? "Success" : "Error"}
                  </span>
                  {fetchResult.success && Array.isArray(fetchResult.data?.questions) && (
                    <span style={{ fontSize: 12, color: "#64748b" }}>
                      {fetchResult.data!.questions.length} questions
                    </span>
                  )}
                </span>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  {fetchResult.success && onRenderInBuilder && (
                    <button
                      style={btnBase}
                      onClick={() => onRenderInBuilder(fetchResult)}
                    >
                      Render in Form Builder
                    </button>
                  )}
                  <button style={btnBase} onClick={handleCopyJson}>
                    <CopyIcon /> Copy JSON
                  </button>
                </div>
              </div>
              <CodeBlock code={JSON.stringify(fetchResult, null, 2)} />
            </div>
          )}
        </Step>
      </div>
    </>
  );
}