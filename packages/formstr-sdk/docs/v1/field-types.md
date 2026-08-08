# Field types

Formstr fields are stored as Nostr tags. The SDK normalizes those tags and
uses the field's `renderElement` setting to choose the HTML control to render.

The generated HTML is intentionally unstyled. An application embedding the
SDK can add its own CSS without having to reimplement the form controls.

## Field tag format

A field tag has six values:

```js
[
  "field",
  "<field-id>",
  "<primitive>",
  "<label>",
  "<JSON-encoded options>",
  "<JSON-encoded configuration>",
]
```

For example, a required date field is represented as:

```js
[
  "field",
  "arrival-date",
  "text",
  "When will you arrive?",
  "[]",
  '{"renderElement":"date","required":true}',
]
```

When creating tags in JavaScript, use `JSON.stringify` for the options and
configuration values:

```js
const field = (id, primitive, label, options, config) => [
  "field",
  id,
  primitive,
  label,
  JSON.stringify(options),
  JSON.stringify(config),
];
```

## Supported types

| `renderElement` | Primitive | Rendered control | Submitted value |
| --- | --- | --- | --- |
| `shortText` | `text` | Text input | String |
| `paragraph` | `text` | Textarea | String |
| `number` | `number` | Number input | Numeric string |
| `radioButton` | `option` | Radio group | Selected option ID |
| `checkboxes` | `option` | Checkbox group | Selected option IDs separated by `;` |
| `dropdown` | `option` | Select menu | Selected option ID |
| `date` | `text` | Date input | `YYYY-MM-DD` |
| `time` | `text` | Time input | `h:mm AM/PM` |
| `datetime` | `text` | Date and time input | Unix timestamp in seconds |
| `rating` | `text` | Range input | JSON containing a normalized value |
| `signature` | `text` | Signature payload textarea | String supplied by the application |
| `fileUpload` | `text` | File input | String returned by `transformFile` |
| `multipleChoiceGrid` | `grid` | One radio choice per row | JSON object of row and column IDs |
| `checkboxGrid` | `grid` | Multiple checkbox choices per row | JSON object with `;`-separated column IDs |
| `label` | `label` | Static content | No response value |

### Supported configuration

| Setting | Used by | Purpose |
| --- | --- | --- |
| `required` | Input fields and grids | Requires a value before the response is published |
| `min`, `max`, `step` | `number` | Sets the native number input constraints |
| `maxStars` | `rating` | Sets the rating scale; defaults to `5` |
| `allowedTypes` | `fileUpload` | Sets the accepted MIME types, such as `image/*` |
| `accept` | `fileUpload` | Sets one accepted MIME type when `allowedTypes` is not provided |
| `multipleFiles` | `fileUpload` | Allows more than one file to be selected |
| `allowMultiplePerRow` | Grid fields | Uses checkboxes when `true` and radio buttons when `false` |
| `requiredRows` | `multipleChoiceGrid` | Marks specific rows as required in the generated HTML |

## Text and number fields

Text fields do not need options. Set `required` when the user must provide a
value. Number fields can also use `min`, `max`, and `step`.

```js
const name = field("name", "text", "Your name", [], {
  renderElement: "shortText",
  required: true,
});

const notes = field("notes", "text", "Anything else we should know?", [], {
  renderElement: "paragraph",
});

const guests = field("guests", "number", "Number of guests", [], {
  renderElement: "number",
  min: 1,
  max: 10,
  step: 1,
});
```

## Choice fields

Radio buttons, checkboxes, and dropdowns use an array of option tuples. Each
tuple contains an option ID, a label, and an optional JSON-encoded option
configuration.

```js
const attendanceOptions = [
  ["yes", "Yes, I will attend"],
  ["no", "No, I cannot attend"],
  ["maybe", "Maybe"],
];

const attendance = field(
  "attendance",
  "option",
  "Will you attend?",
  attendanceOptions,
  { renderElement: "radioButton", required: true },
);

const interests = field(
  "interests",
  "option",
  "What are you interested in?",
  [
    ["nostr", "Nostr"],
    ["lightning", "Lightning"],
  ],
  { renderElement: "checkboxes" },
);

const meal = field(
  "meal",
  "option",
  "Meal preference",
  [
    ["standard", "Standard"],
    ["vegetarian", "Vegetarian"],
  ],
  { renderElement: "dropdown", required: true },
);
```

A radio button or dropdown submits one option ID. A checkbox group submits
all selected option IDs joined with a semicolon, for example
`"nostr;lightning"`.

## Date and time fields

```js
const date = field("date", "text", "Booking date", [], {
  renderElement: "date",
  required: true,
});

const time = field("time", "text", "Preferred time", [], {
  renderElement: "time",
  required: true,
});

const startsAt = field("starts-at", "text", "Start date and time", [], {
  renderElement: "datetime",
  required: true,
});
```

Date values remain in the browser's `YYYY-MM-DD` format. Time values are
converted to Formstr's 12-hour format, and date-time values are converted to
Unix timestamps in seconds before submission.

## Rating fields

`maxStars` defaults to `5`. The rendered range supports half-step ratings.

```js
const rating = field("rating", "text", "How was your experience?", [], {
  renderElement: "rating",
  maxStars: 5,
});
```

Ratings are stored as a normalized value between `0` and `1`. For example, a
rating of four out of five is submitted as:

```json
{"normalizedValue":0.8}
```

## Grid fields

Grid options are an object with `columns` and `rows`. Both contain tuples of
an ID, a label, and an optional JSON-encoded configuration.

```js
const gridOptions = {
  columns: [
    ["poor", "Poor"],
    ["good", "Good"],
    ["great", "Great"],
  ],
  rows: [
    ["quality", "Quality"],
    ["speed", "Speed"],
  ],
};

const singleChoiceGrid = field(
  "feedback",
  "grid",
  "Rate each area",
  gridOptions,
  {
    renderElement: "multipleChoiceGrid",
    allowMultiplePerRow: false,
    required: true,
  },
);

const checkboxGrid = field(
  "notifications",
  "grid",
  "How should we contact you?",
  {
    columns: [
      ["email", "Email"],
      ["sms", "SMS"],
    ],
    rows: [
      ["news", "News"],
      ["reminders", "Reminders"],
    ],
  },
  {
    renderElement: "checkboxGrid",
    allowMultiplePerRow: true,
  },
);
```

A multiple-choice grid stores one column ID for each answered row:

```json
{"quality":"great","speed":"good"}
```

A checkbox grid stores multiple column IDs as a semicolon-separated string:

```json
{"news":"email;sms","reminders":"sms"}
```

## Labels

Labels add explanatory content to a form and do not produce a response value.

```js
const detailsHeading = field(
  "details-heading",
  "label",
  "Please provide your booking details below.",
  [],
  { renderElement: "label" },
);
```

## Signatures

The SDK renders a textarea for a signature payload. It does not create a
Nostr signature on the user's behalf. The embedding application is
responsible for signing the required event and placing its serialized value
in the field.

```js
const signature = field("signature", "text", "Signed confirmation", [], {
  renderElement: "signature",
  required: true,
});
```

## File uploads

The SDK renders the file input but leaves storage and encryption to the
embedding application. Use `allowedTypes` to set the input's accepted MIME
types.

```js
const attachment = field("attachment", "text", "Supporting document", [], {
  renderElement: "fileUpload",
  allowedTypes: ["image/*", "application/pdf"],
});
```

Pass `transformFile` when attaching the submit listener. It should upload the
file and return the string that will be stored in the response, usually
JSON-encoded encrypted Blossom metadata.

```js
sdk.attachSubmitListener(form, signer, {
  transformFile: async (file, field, currentForm) => {
    const metadata = await uploadEncryptedFile(file, {
      field,
      form: currentForm,
    });

    return JSON.stringify(metadata);
  },
  onSuccess: ({ event }) => {
    console.log("Response published", event.id);
  },
  onError: (error) => {
    console.error("Could not submit response", error);
  },
});
```

The SDK does not include raw file bytes in a Nostr response. If a user selects
a file and no `transformFile` callback is provided, submission fails with an
error.

## Rendering and submitting a form

After fetching a form, call `renderHtml`, mount the generated HTML, and then
attach the submit listener:

```js
const form = await sdk.fetchForm(naddr);

sdk.renderHtml(form);
document.querySelector("#form-container").innerHTML = form.html.form;

sdk.attachSubmitListener(form, undefined, {
  onSuccess: ({ event }) => {
    console.log("Response published", event.id);
  },
  onError: (error) => {
    console.error("Could not submit response", error);
  },
});
```

`attachSubmitListener` collects repeated checkbox and grid values, validates
required fields, converts specialized values, signs the response, and
publishes it to the relays listed by the form.
