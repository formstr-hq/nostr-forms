import { Event, nip44 } from "nostr-tools";
import { Field, Tag, GridOptions, GridResponse } from "../nostr/types";
import { getDefaultRelays } from "../nostr/common";
import { hexToBytes } from "nostr-tools/utils";

export const getResponseRelays = (formEvent: Event): string[] => {
  let formRelays = formEvent.tags
    .filter((r) => r[0] === "relay")
    ?.map((r) => r[1]);
  if (formRelays.length === 0) formRelays = getDefaultRelays();
  return Array.from(new Set(formRelays));
};

export const getInputsFromResponseEvent = (
  responseEvent: Event,
  editKey: string | undefined | null
): Tag[] => {
  if (responseEvent.content === "") {
    return responseEvent.tags.filter(
      (tag): tag is Tag => Array.isArray(tag) && tag[0] === "response"
    );
  } else if (editKey) {
    try {
      const conversationKey = nip44.v2.utils.getConversationKey(
        hexToBytes(editKey),
        responseEvent.pubkey
      );
      const decryptedContent = nip44.v2.decrypt(
        responseEvent.content,
        conversationKey
      );
      const parsed = JSON.parse(decryptedContent);
      if (Array.isArray(parsed)) {
        return parsed.filter(
          (tag: Tag): tag is Tag => Array.isArray(tag) && tag[0] === "response"
        );
      }
      console.warn("Decrypted response content is not an array:", parsed);
      return [];
    } catch (e) {
      console.error("Failed to parse decrypted response content:", e);
      return [];
    }
  } else {
    console.warn("Cannot decrypt response: EditKey not available.");
    return [];
  }
};

export interface DisplayableAnswerDetail {
  questionLabel: string;
  responseLabel: string;
  fieldId: string;
}

export const getResponseLabels = (
  inputTag: Tag,
  formSpec: Tag[]
): DisplayableAnswerDetail => {
  const [_resPlaceholder, fieldId, answerValue, metadataString] = inputTag;
  let questionLabel = `Question ID: ${fieldId}`;
  let responseLabel = answerValue ?? "N/A";
  const questionField = formSpec.find(
    (tag): tag is Field => tag[0] === "field" && tag[1] === fieldId
  );

  if (questionField) {
    questionLabel = questionField[3] || questionLabel;
    if (questionField[2] === "option" && answerValue) {
      try {
        const choices = JSON.parse(questionField[4] || "[]") as Tag[];
        const selectedChoiceIds = answerValue.split(";");
        const metadata = JSON.parse(metadataString || "{}");
        const choiceLabels = choices
          .filter((choice) => selectedChoiceIds.includes(choice[0]))
          .map((choice) => {
            let label = choice[1];
            if (metadata.message) {
              try {
                const isOther = JSON.parse(choice[2] || "{}")?.isOther === true;
                if (isOther) {
                  label += ` (${metadata.message})`;
                }
              } catch {}
            }
            return label;
          });

        if (choiceLabels.length > 0) {
          responseLabel = choiceLabels.join(", ");
        }
      } catch (e) {
        console.warn("Error processing options for fieldId:", fieldId, e);
      }
    }

    if (questionField[2] === "grid" && answerValue) {
      try {
        const gridOptions: GridOptions = JSON.parse(
          questionField[4] || '{"columns":[],"rows":[]}'
        );
        const responses: GridResponse = JSON.parse(answerValue);

        // Convert to human-readable format
        const readable: string[] = [];
        for (const [rowId, columnIds] of Object.entries(responses)) {
          const row = gridOptions.rows.find((r) => r[0] === rowId);
          const rowLabel = row ? row[1] : rowId;

          // Split for multiple selections (checkbox grid)
          const selectedCols = columnIds.split(";").filter(Boolean);
          const colLabels = selectedCols.map((colId) => {
            const col = gridOptions.columns.find((c) => c[0] === colId);
            return col ? col[1] : colId;
          });

          readable.push(`${rowLabel}: ${colLabels.join(", ")}`);
        }

        responseLabel = readable.join(" | ");
      } catch (e) {
        console.warn("Error processing grid response:", e);
      }
    }

    if (questionField[2] === "datetime" && answerValue) {
      const epoch = Number(answerValue);
      if (!isNaN(epoch)) {
        const date = new Date(epoch * 1000); // convert seconds → ms
        const formatted = date.toLocaleString(undefined, {
          year: "numeric",
          month: "short",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        });
        const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
        responseLabel = `${formatted} (${timezone})`;
      }
    }
  }
  return { questionLabel, responseLabel, fieldId };
};
