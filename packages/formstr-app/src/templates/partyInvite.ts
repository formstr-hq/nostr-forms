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

const emailRegex = "^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$";

export const createPartyInviteTemplate = (t: TFunction): FormTemplate => ({
  id: 'partyInvite',
  name: t('templates.partyInvite.name'),
  description: t('templates.partyInvite.description'),
  initialState: {
    formName: t('templates.partyInvite.formName'),
    formSettings: {
      description: t('templates.partyInvite.formDescription'),
      thankYouPage: true,
      notifyNpubs: [],
      publicForm: true,
      disallowAnonymous: false,
      encryptForm: true,
      viewKeyInUrl: true,
    },
    questionsList: [
      // Field 1: Name (Required, Short Text)
      [
        'field', 
        generateFieldId(),
        'text', // dataType
        t('templates.partyInvite.nameQuestion'),
        '[]', // options
        '{"renderElement": "shortText", "required": true}', // config
      ] as Field,

      // Field 2: Attendance (Required, Single Choice / Radio Button)
      [
        'field', 
        generateFieldId(),
        'option', // dataType
        t('templates.partyInvite.attendQuestion'),
        createOptionsString([
          [t('templates.partyInvite.yesAttend'), ""],
          [t('templates.partyInvite.cantAttend'), ""],
        ]), // options
        '{"renderElement": "radioButton", "required": true}', // config
      ] as Field,

       // Field 3: How many attending (Not Required, Number)
       [
        'field', 
        generateFieldId(),
        'number', // dataType
        t('templates.partyInvite.partySizeQuestion'),
        '[]', // options
        '{"renderElement": "number", "required": false, "min": 1}', // config (min 1 if they enter a number)
      ] as Field,

      // Field 4: What bringing (Not Required, Multiple Choice / Checkboxes)
      [
        'field', 
        generateFieldId(),
        'option', // dataType
        t('templates.partyInvite.bringingQuestion'),
        createOptionsString([
          [t('templates.partyInvite.mains'), ""],
          [t('templates.partyInvite.salad'), ""],
          [t('templates.partyInvite.dessert'), ""],
          [t('templates.partyInvite.drinks'), ""],
          [t('templates.partyInvite.sides'), ""],
          [t('templates.partyInvite.other'), ""],
        ]), // options
        '{"renderElement": "checkboxes", "required": false}', // config
      ] as Field,

       // Field 5: Allergies (Not Required, Paragraph)
       [
        'field', 
        generateFieldId(),
        'text', // dataType
        t('templates.partyInvite.allergiesQuestion'),
        '[]', // options
        '{"renderElement": "paragraph", "required": false}', // config
      ] as Field,

      // Field 6: Email (Not Required, Short Text, Email Validation)
      [
        'field', 
        generateFieldId(),
        'text', // dataType
        t('templates.partyInvite.emailQuestion'),
        '[]', // options
        JSON.stringify({ // Stringify the config object
            renderElement: "shortText",
            required: false, // Set to false as per field list
            validationRules: {
              regex: {
                pattern: emailRegex,
                errorMessage: t('templates.partyInvite.emailInvalid')
              }
            }
          }), // config
      ] as Field,
    ],
  },
});

fieldCounter = 0;
optionCounter = 0;
