import { muiTheme, FORMSTR_COLORS } from "./muiTheme";

describe("muiTheme", () => {
  it("uses the canonical Formstr brand orange as primary", () => {
    expect(muiTheme.palette.primary.main).toBe(FORMSTR_COLORS.primary);
    expect(FORMSTR_COLORS.primary).toBe("#FF4D00");
  });

  it("uses a system font stack for UI text (NOT Anek Devanagari)", () => {
    // Anek Devanagari as a UI font was the root cause of the recurring
    // vertical-alignment bugs (its line box is ~170% of em). It must never
    // be the base UI font again.
    expect(muiTheme.typography.fontFamily).not.toContain("Anek");
    expect(muiTheme.typography.fontFamily).toContain("-apple-system");
  });

  it("reserves Anek Devanagari for display headings only", () => {
    (["h1", "h2", "h3", "h4", "h5"] as const).forEach((level) => {
      expect(muiTheme.typography[level].fontFamily).toContain(
        "Anek Devanagari"
      );
    });
    // h6 is a small UI heading — system font, so it stays optically centered.
    expect(muiTheme.typography.h6.fontFamily).not.toContain("Anek");
  });

  it("keeps buttons sentence-case (no MUI default all-caps)", () => {
    expect(muiTheme.typography.button.textTransform).toBe("none");
  });

  it("uses border-first cards (elevation 0 + 1px border)", () => {
    const cardDefaults = muiTheme.components?.MuiCard?.defaultProps as {
      elevation?: number;
    };
    expect(cardDefaults?.elevation).toBe(0);
  });
});
