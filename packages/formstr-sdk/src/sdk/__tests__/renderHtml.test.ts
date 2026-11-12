import { FormstrSDK } from "../FormstrSDK";

const sdk = new FormstrSDK();

const form = (fields: string[][], extra: string[][] = []) =>
  sdk.renderHtml(
    sdk.normalizeForm([
      ["d", "f1"],
      ["name", "Feedback"],
      ["pubkey", "a".repeat(64)],
      ...fields,
      ...extra,
    ]),
  ).html!.form;

describe("renderHtml", () => {
  it("links each label to its control", () => {
    const html = form([["field", "q1", "text", "Your name", "[]", "{}"]]);
    expect(html).toContain('<label for="formstr-f1-q1">Your name</label>');
    expect(html).toContain('<input type="text" id="formstr-f1-q1" name="q1" />');
  });

  it("renders paragraph fields as a textarea", () => {
    const html = form([["field", "q1", "text", "Tell us more", "[]", '{"renderElement":"paragraph"}']]);
    expect(html).toContain('<textarea id="formstr-f1-q1" name="q1" rows="3"></textarea>');
    expect(html).not.toContain('<input type="text"');
  });

  it("marks required fields", () => {
    const html = form([
      ["field", "q1", "text", "Name", "[]", '{"required":true}'],
      ["field", "q2", "option", "Pick", '[["o0","A"],["o1","B"]]', '{"required":true}'],
    ]);
    expect(html).toContain('name="q1" required />');
    // one required radio makes the whole group required
    expect(html).toContain('value="o0" required />');
    expect(html).toContain('value="o1" />');
    expect(html).toContain('aria-required="true"');
  });

  it("names radio groups by their question", () => {
    const html = form([["field", "q2", "option", "Pick one", '[["o0","A"]]', "{}"]]);
    expect(html).toContain('role="radiogroup" aria-labelledby="formstr-f1-q2-label"');
    expect(html).toContain('<div class="option-label" id="formstr-f1-q2-label">Pick one</div>');
  });

  it("escapes everything that comes from the form event", () => {
    const html = form(
      [
        ["field", "q1", "text", '<img src=x onerror="alert(1)"', "[]", "{}"],
        ["field", 'q2" onfocus="alert(2)', "option", "Q & A", '[["o0\\" autofocus x=\\"","<b>bold</b> option"]]', "{}"],
      ],
      [["settings", JSON.stringify({ description: "Fish & <i>chips</i>" })]],
    );
    // No live tag or attribute survives: only escaped text.
    expect(html).not.toMatch(/<img|onerror="|onfocus="|autofocus x="/);
    expect(html).toContain("&lt;img src=x onerror=&quot;alert(1)&quot;");
    expect(html).toContain("Q &amp; A");
    expect(html).toContain('name="q2&quot; onfocus=&quot;alert(2)"');
    expect(html).toContain("bold option");
    expect(html).toContain("Fish &amp; chips");
  });

  it("escapes the form id in attributes", () => {
    const html = sdk.renderHtml(sdk.normalizeForm([["d", '"><script>x</script>'], ["name", "x"]])).html!.form;
    expect(html).not.toContain("<script>");
    expect(html).toContain('id="form-&quot;&gt;&lt;script&gt;x&lt;/script&gt;"');
  });
});
