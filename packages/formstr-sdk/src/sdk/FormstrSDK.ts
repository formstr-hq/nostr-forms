import {
  Event,
  EventTemplate,
  finalizeEvent,
  generateSecretKey,
  getPublicKey,
  nip19,
  nip44,
} from "nostr-tools";
import { bytesToHex } from "@noble/hashes/utils.js";
import {
  CreateFormOptions,
  CreateFormResult,
  FormBlock,
  FormField,
  FormSettings,
  FormsSigner,
  GridOptions,
  MyFormSummary,
  NormalizedField,
  NormalizedForm,
  RelayPublishResult,
  SectionBlock,
  Tag,
} from "./types.js";
import { fetchFormTemplate, getDefaultRelays } from "./utils/fetchFormTemplate.js";
import { escapeHtml, stripHtml } from "./utils/helper.js";
import { encodeNKeys } from "./utils/nkeys.js";
import { pool } from "./pool.js";

const KIND_FORM = 30168;
const KIND_MY_FORMS_LIST = 14083;

export class FormstrSDK {
  // Serialises saveToMyForms writes per user so concurrent calls don't
  // race on the read-modify-write of the replaceable kind-14083 list.
  private myFormsWriteQueue = new Map<string, Promise<void>>();

  /** Fetch a form via NIP-101 naddr */

  //Discouraged use, will completely move to NKeys once app migrates.
  async fetchFormWithViewKey(
    naddr: string,
    viewKey: string,
  ): Promise<NormalizedForm> {
    const nkeys = encodeNKeys({ viewKey });
    return await this.fetchForm(naddr, nkeys);
  }

  attachSubmitListener(
    form: NormalizedForm,
    signer?: FormsSigner,
    callbacks?: {
      onSuccess?: (result: { event: Event; relays: string[] }) => void;
      onError?: (error: unknown) => void;
    },
  ) {
    const formEl = document.getElementById(
      `form-${form.id}`,
    ) as HTMLFormElement;
    if (!formEl)
      return;

    formEl.addEventListener("submit", async (e) => {
      e.preventDefault(); // prevent page reload

      // Collect form values
      const formData = new FormData(formEl);
      const values: Record<string, any> = {};
      formData.forEach((v, k) => (values[k] = v));

      try {
        const result = await this.submit(form, values, signer);

        callbacks?.onSuccess?.({
          event: result,
          relays: form.relays,
        });
      } catch (err) {
        callbacks?.onError?.(err);
      }
    });
  }

  async fetchForm(naddr: string, nkeys?: string): Promise<NormalizedForm> {
    const rawForm = await fetchFormTemplate(naddr, nkeys);
    if (!rawForm) return this.normalizeForm([["name", "Form Not Found"]]);
    return this.normalizeForm(rawForm);
  }

  /** Normalize raw NIP-101 form tags into JS object */
  normalizeForm(raw: Tag[]): NormalizedForm {
    const idTag = raw.find((t) => t[0] === "d");
    const nameTag = raw.find((t) => t[0] === "name");
    const settingsTag = raw.find((t) => t[0] === "settings");
    const relaysTag = raw.filter((t) => t[0] === "relay");
    const relays = relaysTag?.map((r) => r[1]) || [];
    const pubkey = raw.find((t) => t[0] === "pubkey")?.[1] || "";
    const formSettings: FormSettings = settingsTag
      ? JSON.parse(settingsTag[1])
      : {};

    const fields: Record<string, NormalizedField> = {};
    const fieldOrder: string[] = [];

    raw
      .filter((t) => t[0] === "field")
      .forEach((t) => {
        const [_, fieldId, type, label, optionsStr, configStr] = t;

        fields[fieldId] = {
          id: fieldId,
          type,
          labelHtml: label,
          options: optionsStr
            ? JSON.parse(optionsStr).map((o: any[]) => ({
                id: o[0],
                labelHtml: stripHtml(o[1]),
                config: o[2] ? JSON.parse(o[2]) : undefined,
              }))
            : undefined,
          config: configStr ? JSON.parse(configStr) : {},
        };

        fieldOrder.push(fieldId);
      });

    const blocks: FormBlock[] = [];

    // Intro block (optional)
    if (nameTag || formSettings.description) {
      blocks.push({
        type: "intro",
        title: stripHtml(nameTag?.[1]),
        description: stripHtml(formSettings.description),
      });
    }

    // Section blocks
    if (formSettings.sections?.length) {
      blocks.push(
        ...[...formSettings.sections]
          .sort((a, b) => a.order - b.order)
          .map(
            (s): SectionBlock => ({
              type: "section",
              id: s.id,
              title: s.title,
              description: s.description,
              questionIds: s.questionIds,
              order: s.order,
            }),
          ),
      );
    } else {
      // Fallback: single implicit section
      blocks.push({
        type: "section",
        id: "default",
        title: undefined,
        description: undefined,
        questionIds: fieldOrder,
        order: 0,
      });
    }

    return {
      id: idTag?.[1] || "",
      blocks,
      name: stripHtml(nameTag?.[1]),
      fields,
      fieldOrder,
      settings: formSettings,
      relays,
      pubkey,
    };
  }

  /** Render HTML form with submit wired using FormData */
  renderHtml(form: NormalizedForm): NormalizedForm {
    // Everything interpolated below comes from the form event, so it is
    // escaped: `text` for visible text (tags stripped, as before), `attr` for
    // attribute values.
    const text = (v: unknown) => escapeHtml(stripHtml(v == null ? "" : String(v)));
    const attr = escapeHtml;
    // Unique per form, so two embedded forms can't collide.
    const domId = (field: NormalizedField) => `formstr-${form.id}-${field.id}`;

    const renderField = (field: NormalizedField) => {
      const required = !!field.config?.required;
      const req = required ? " required" : "";

      if (field.type === "text") {
        const id = domId(field);
        const control =
          field.config?.renderElement === "paragraph"
            ? `<textarea id="${attr(id)}" name="${attr(field.id)}" rows="3"${req}></textarea>`
            : `<input type="text" id="${attr(id)}" name="${attr(field.id)}"${req} />`;
        return `
        <label for="${attr(id)}">${text(field.labelHtml)}</label>
        ${control}
      `;
      }

      if (field.type === "option" && field.options) {
        const labelId = `${domId(field)}-label`;
        return `
        <div class="option-group" role="radiogroup" aria-labelledby="${attr(labelId)}"${required ? ' aria-required="true"' : ""}>
          <div class="option-label" id="${attr(labelId)}">${text(field.labelHtml)}</div>
          ${field.options
            .map(
              (opt, i) => `
              <label>
                <input type="radio" name="${attr(field.id)}" value="${attr(opt.id)}"${i === 0 ? req : ""} />
                ${text(opt.labelHtml)}
              </label>
            `,
            )
            .join("")}
        </div>
      `;
      }

      if (field.type === "label") {
        return `<p>${text(field.labelHtml)}</p>`;
      }

      if (field.type === "grid" && field.options) {
        const gridOptions = field.options as unknown as GridOptions;
        const isCheckbox = field.config.allowMultiplePerRow;
        const inputType = isCheckbox ? "checkbox" : "radio";

        return `
        <div class="grid-question">
          <div class="grid-label">${text(field.labelHtml)}</div>
          <table class="grid-table">
            <thead>
              <tr>
                <th></th>
                ${gridOptions.columns?.map((col) => `<th>${text(col[1])}</th>`).join("")}
              </tr>
            </thead>
            <tbody>
              ${gridOptions.rows
                ?.map(
                  (row) => `
                <tr>
                  <td>${text(row[1])}</td>
                  ${gridOptions.columns
                    ?.map(
                      (col) => `
                    <td>
                      <input
                        type="${inputType}"
                        name="${attr(`${field.id}_${row[0]}`)}"
                        value="${attr(col[0])}"
                        ${inputType === "radio" ? "" : ""}
                      />
                    </td>
                  `,
                    )
                    .join("")}
                </tr>
              `,
                )
                .join("")}
            </tbody>
          </table>
        </div>
      `;
      }

      return "";
    };

    const renderBlock = (block: any) => {
      if (block.type === "intro") {
        return `
        <section class="form-section form-intro">
          ${block.title ? `<div class="form-name">${text(block.title)}</div>` : ""}
          ${
            block.description
              ? `<div class="form-description">${text(block.description)}</div>`
              : ""
          }
        </section>
      `;
      }

      if (block.type === "section") {
        return `
        <section class="form-section">
          ${block.title ? `<h2 class="section-title">${text(block.title)}</h2>` : ""}
          ${
            block.description
              ? `<div class="section-description">${text(block.description)}</div>`
              : ""
          }
          ${block.questionIds
            .map((id: string) => renderField(form.fields[id]))
            .join("\n")}
        </section>
      `;
      }

      return "";
    };

    const bodyHtml = form.blocks?.map(renderBlock).join("\n");

    // Neutral wrapper
    form.html = {
      form: `
    <form id="form-${attr(form.id)}">
      <div class="form-body">
        ${bodyHtml}
      </div>
      <div id="submit-container">
        <button type="submit" id="form-submit-${attr(form.id)}">Submit</button>
      </div>
    </form>
  `,
    };

    return form;
  }

  /** Submit response back to relays, NIP-44 encrypted to the form's pubkey */
  async submit(
    form: NormalizedForm,
    values: Record<string, any>,
    signer?: FormsSigner,
  ) {
    const responseTags: Tag[] = Object.entries(values).map(([fieldId, value]) => {
      const field = form.fields[fieldId];
      if (field?.type === "grid") {
        const jsonValue = typeof value === "string" ? value : JSON.stringify(value);
        return ["response", fieldId, jsonValue, "{}"];
      }
      if (Array.isArray(value)) value = value.join(";");
      return ["response", fieldId, value, "{}"];
    });

    let content: string;
    let signerFn: (event: EventTemplate) => Promise<Event>;

    if (signer) {
      // Identified submission: encrypt with the caller's NIP-44 key
      content = await signer.nip44Encrypt(form.pubkey, JSON.stringify(responseTags));
      signerFn = (event) => signer.signEvent(event);
    } else {
      // Anonymous submission: ephemeral key used for both signing and encryption
      // so the form owner can derive the conversation key from the event pubkey
      const ephSk = generateSecretKey();
      const conversationKey = nip44.v2.utils.getConversationKey(ephSk, form.pubkey);
      content = nip44.v2.encrypt(JSON.stringify(responseTags), conversationKey);
      signerFn = (event) => Promise.resolve(finalizeEvent(event, ephSk));
    }

    const event: EventTemplate = {
      kind: 1069,
      content,
      tags: [["a", `30168:${form.pubkey}:${form.id}`]],
      created_at: Math.floor(Date.now() / 1000),
    };
    const signed = await signerFn(event);
    const acceptedRelays: string[] = [];
    await Promise.allSettled(
      pool.publish(form.relays, signed).map((p, i) =>
        p
          .then(() => acceptedRelays.push(form.relays[i]))
          .catch(() => {}),
      ),
    );
    if (acceptedRelays.length === 0) {
      throw new Error(
        "No relay accepted the response. It has not been submitted. Please try again.",
      );
    }
    return signed;
  }

  /**
   * Publish a new form (kind 30168) using an ephemeral keypair.
   * If `options.encrypt` is true, fields are NIP-44 encrypted into `content`
   * and only the `d` tag is included (no `t` tag). Otherwise a public form
   * is created with fields in tags and `["t", "public"]`.
   * If `options.signer` is provided, the ephemeral keys are saved to the
   * user's encrypted MyForms list (kind 14083).
   */
  async createForm(
    name: string,
    fields: FormField[],
    options: CreateFormOptions = {},
  ): Promise<CreateFormResult> {
    const rawFields = fields.map(formFieldToTag);
    const relays = options.relays?.length ? options.relays : getDefaultRelays();

    const signingKey = generateSecretKey();
    const signingKeyHex = bytesToHex(signingKey);
    const formPubkey = getPublicKey(signingKey);

    const formId = makeRandomId(6);

    let tags: Tag[];
    let content: string;
    let viewKeyHex: string | undefined;

    if (options.encrypt !== false) {
      const viewKey = generateSecretKey();
      viewKeyHex = bytesToHex(viewKey);
      const conversationKey = nip44.v2.utils.getConversationKey(signingKey, getPublicKey(viewKey));
      content = nip44.v2.encrypt(JSON.stringify([["name", name], ...rawFields]), conversationKey);
      tags = [
        ["d", formId],
        ...relays.map((r) => ["relay", r]),
      ];
    } else {
      content = "";
      tags = [
        ["d", formId],
        ["name", name],
        ...rawFields,
        ["t", "public"],
        ...relays.map((r) => ["relay", r]),
      ];
    }

    const event: EventTemplate = {
      kind: KIND_FORM,
      created_at: Math.floor(Date.now() / 1000),
      tags,
      content,
    };

    const signed = finalizeEvent(event, signingKey);
    const formRelays: RelayPublishResult = { accepted: [], rejected: [] };
    await Promise.allSettled(
      pool.publish(relays, signed).map((p, i) =>
        p
          .then(() => formRelays.accepted.push(relays[i]))
          .catch(() => formRelays.rejected.push(relays[i])),
      ),
    );

    const naddr = nip19.naddrEncode({
      pubkey: formPubkey,
      identifier: formId,
      relays: formRelays.accepted.length ? formRelays.accepted : relays,
      kind: KIND_FORM,
    });

    let myFormsEvent: Event | undefined;
    let myFormsRelays: RelayPublishResult | undefined;
    if (options.signer) {
      const secretData = viewKeyHex ? `${signingKeyHex}:${viewKeyHex}` : signingKeyHex;
      try {
        ({ event: myFormsEvent, relays: myFormsRelays } = await this.saveToMyForms(
          formPubkey,
          secretData,
          formId,
          relays,
          options.signer,
        ));
      } catch {
        myFormsRelays = { accepted: [], rejected: relays };
      }
    }

    return {
      naddr,
      signingKeyHex,
      ...(viewKeyHex && { viewKeyHex }),
      formEvent: signed,
      formRelays,
      myFormsEvent,
      myFormsRelays,
    };
  }

  /**
   * Save ephemeral form keys to the user's encrypted MyForms list (kind 14083).
   * Uses the same NIP-44 encrypted tag format as the nostr-forms app:
   * `["f", "formPubkey:formId", relay, "secretKey"]`
   *
   * Calls are serialised per user pubkey so concurrent invocations (e.g. two
   * rapid /form inserts) never race on the read-modify-write cycle.
   */
  async saveToMyForms(
    formAuthorPub: string,
    formAuthorSecretHex: string,
    formId: string,
    relays: string[],
    signer: FormsSigner,
  ): Promise<{ event: Event; relays: RelayPublishResult }> {
    const userPub = await signer.getPublicKey();

    // Chain this write onto any in-flight write for the same user.
    // The .catch keeps a failed write from permanently blocking the queue.
    const prev = this.myFormsWriteQueue.get(userPub) ?? Promise.resolve();
    const next = prev.then(() =>
      this._writeToMyForms(userPub, formAuthorPub, formAuthorSecretHex, formId, relays, signer),
    );
    this.myFormsWriteQueue.set(userPub, next.catch(() => {}) as Promise<void>);
    return next;
  }

  private async _writeToMyForms(
    userPub: string,
    formAuthorPub: string,
    formAuthorSecretHex: string,
    formId: string,
    relays: string[],
    signer: FormsSigner,
  ): Promise<{ event: Event; relays: RelayPublishResult }> {
    const targetRelays = relays.length ? relays : getDefaultRelays();

    // Always re-fetch inside the queue so we read the result of the previous
    // write, not a stale snapshot from before it was published.
    const existing = await pool.get(targetRelays, {
      kinds: [KIND_MY_FORMS_LIST],
      authors: [userPub],
    });

    let forms: Tag[] = [];
    if (existing) {
      try {
        const decrypted = await signer.nip44Decrypt(userPub, existing.content);
        forms = JSON.parse(decrypted);
      } catch {
        forms = [];
      }
    }

    const key = `${formAuthorPub}:${formId}`;
    if (!forms.some((f) => f[1] === key)) {
      forms.push(["f", key, targetRelays[0], formAuthorSecretHex]);
    }

    const encrypted = await signer.nip44Encrypt(userPub, JSON.stringify(forms));

    const listEvent = await signer.signEvent({
      kind: KIND_MY_FORMS_LIST,
      created_at: Math.floor(Date.now() / 1000),
      tags: [],
      content: encrypted,
    });

    const publishResults = await Promise.allSettled(pool.publish(targetRelays, listEvent));
    const relayResult: RelayPublishResult = { accepted: [], rejected: [] };
    publishResults.forEach((r, i) => {
      if (r.status === "fulfilled") relayResult.accepted.push(targetRelays[i]);
      else relayResult.rejected.push(targetRelays[i]);
    });
    return { event: listEvent, relays: relayResult };
  }

  /**
   * Fetch the user's saved forms from their encrypted MyForms list (kind 14083).
   * Returns a summary for each form — name, field count, and a ready-to-use naddr.
   * Forms whose kind-30168 event cannot be found on any relay are silently skipped.
   */
  async fetchMyForms(
    signer: FormsSigner,
    relays?: string[],
  ): Promise<MyFormSummary[]> {
    const userPub = await signer.getPublicKey();
    const targetRelays = relays?.length ? relays : getDefaultRelays();

    const listEvent = await pool.get(targetRelays, {
      kinds: [KIND_MY_FORMS_LIST],
      authors: [userPub],
    });

    if (!listEvent) return [];

    let entries: Tag[];
    try {
      const decrypted = await signer.nip44Decrypt(userPub, listEvent.content);
      entries = JSON.parse(decrypted);
    } catch {
      return [];
    }

    // Batch-fetch all the kind-30168 form events in one query
    const dTags = entries.map((f) => f[1].split(":")[1]).filter(Boolean);
    const pubkeys = entries.map((f) => f[1].split(":")[0]).filter(Boolean);

    const formEvents = await pool.querySync(targetRelays, {
      kinds: [KIND_FORM],
      "#d": dTags,
      authors: pubkeys,
    });

    const summaries: MyFormSummary[] = [];

    for (const entry of entries) {
      const [, formData, relay, secretData] = entry;
      const [formPubkey, formId] = formData.split(":");
      if (!formPubkey || !formId) continue;

      const event = formEvents.find(
        (e) => e.pubkey === formPubkey && e.tags.some((t) => t[0] === "d" && t[1] === formId),
      );
      if (!event) continue;

      const name =
        event.tags.find((t) => t[0] === "name")?.[1] || "Untitled form";
      const fieldCount = event.tags.filter((t) => t[0] === "field").length;
      const eventRelays = event.tags
        .filter((t) => t[0] === "relay")
        .map((t) => t[1]);

      const naddr = nip19.naddrEncode({
        pubkey: formPubkey,
        identifier: formId,
        relays: eventRelays.length ? eventRelays : [relay],
        kind: KIND_FORM,
      });

      // secretData may be "signingKey" or "signingKey:viewKey" depending on whether
      // the form was saved by the nostr-forms app (which appends the viewKey).
      const [secretKey, viewKey] = (secretData ?? "").split(":");
      const keyObj: Record<string, string> = {};
      if (secretKey) keyObj.secretKey = secretKey;
      if (viewKey) keyObj.viewKey = viewKey;
      const nkeys = Object.keys(keyObj).length > 0 ? encodeNKeys(keyObj) : undefined;

      summaries.push({ naddr, formId, formPubkey, name, fieldCount, relay, nkeys });
    }

    return summaries;
  }
}
const RENDER_ELEMENT_TO_PRIMITIVE: Record<string, string> = {
  shortText: "text",
  paragraph: "text",
  date: "text",
  time: "text",
  datetime: "text",
  signature: "text",
  fileUpload: "text",
  number: "number",
  label: "label",
  radioButton: "option",
  checkboxes: "option",
  dropdown: "option",
  multipleChoiceGrid: "grid",
  checkboxGrid: "grid",
};

function formFieldToTag(field: FormField): Tag {
  const id = makeRandomId(8);
  const primitive = RENDER_ELEMENT_TO_PRIMITIVE[field.type] ?? "text";
  const optionsJson = field.options?.length
    ? JSON.stringify(field.options.map((o) => [makeRandomId(4), o]))
    : "[]";
  const config = JSON.stringify({ renderElement: field.type, required: field.required ?? false });
  return ["field", id, primitive, field.label, optionsJson, config];
}

function makeRandomId(length: number): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export function createEphemeralSigner() {
  const sk = generateSecretKey();
  const pk = getPublicKey(sk);

  return async (event: EventTemplate) => {
    return finalizeEvent(
      {
        ...event,
      },
      sk,
    );
  };
}
