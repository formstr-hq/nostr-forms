import { FormTemplate } from './types';
import { Field, Option } from '../nostr/types';
import { TFunction } from 'i18next';

let fieldCounter = 0;
let optionCounter = 0;
const generateFieldId = (): string => `template_field_${Date.now()}_${fieldCounter++}`;
const generateOptionId = (): string => `template_option_${Date.now()}_${optionCounter++}`;

const createOptionsString = (options: Array<[string, string]>): string => {
    const optionsWithIds: Option[] = options.map(([label]) => [generateOptionId(), label]);
    return JSON.stringify(optionsWithIds);
};

export const createRsvpTemplate = (t: TFunction): FormTemplate => ({
  id: 'rsvp',
  name: t('templates.rsvp.name'),
  description: t('templates.rsvp.description'),
  initialState: {
    formName: t('templates.rsvp.formName'),
    formSettings: {
      description: t('templates.rsvp.formDescription'),
      thankYouPage: true,
      notifyNpubs: [],
      publicForm: true,
      disallowAnonymous: false,
      encryptForm: true,
      viewKeyInUrl: true,
    },
    questionsList: [
      [
        'field', 
        generateFieldId(),
        'option', // dataType
        t('templates.rsvp.attendQuestion'),
        createOptionsString([
          [t('templates.rsvp.yesAttend'), ""],
          [t('templates.rsvp.cantAttend'), ""],
        ]), // options
        '{"renderElement": "radioButton", "required": true}', // config (Radio button, required)
      ] as Field,

      // Field 2: Names of Attendees (Text / Paragraph)
      [
        'field', 
        generateFieldId(),
        'text', // dataType
        t('templates.rsvp.attendeeNamesQuestion'),
        '[]', // options (none)
        '{"renderElement": "paragraph", "required": false}', // config (Using paragraph for potentially long list, not required)
      ] as Field,

      // Field 3: How Heard (Multiple Choice / Checkboxes)
      [
        'field', 
        generateFieldId(),
        'option', // dataType
        t('templates.rsvp.referralQuestion'),
        createOptionsString([
          [t('templates.rsvp.website'), ""],
          [t('templates.rsvp.friend'), ""],
          [t('templates.rsvp.newsletter'), ""],
          [t('templates.rsvp.advertisement'), ""],
        ]), // options
        '{"renderElement": "checkboxes", "required": false}', // config (Checkboxes, not required)
      ] as Field,

      // Field 4: Comments (Text / Paragraph)
      [
        'field', 
        generateFieldId(),
        'text', // dataType
        t('templates.rsvp.commentsQuestion'),
        '[]', // options (none)
        '{"renderElement": "paragraph", "required": false}', // config (Using paragraph, not required)
      ] as Field,
    ],
  },
});

fieldCounter = 0;
optionCounter = 0;
