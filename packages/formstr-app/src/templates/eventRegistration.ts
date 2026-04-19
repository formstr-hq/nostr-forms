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

export const createEventRegistrationTemplate = (t: TFunction): FormTemplate => ({
  id: 'eventRegistration',
  name: t('templates.eventRegistration.name'),
  description: t('templates.eventRegistration.description'),
  initialState: {
    formName: t('templates.eventRegistration.formName'),
    formSettings: {
      description: t('templates.eventRegistration.formDescription'),
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
        t('templates.eventRegistration.nameQuestion'),
        '[]', // options
        '{"renderElement": "shortText", "required": true}', // config
      ] as Field,

      // Field 2: Email (Required, Short Text, Email Validation)
      [
        'field', 
        generateFieldId(),
        'text', // dataType
        t('templates.eventRegistration.emailQuestion'),
        '[]', // options
        JSON.stringify({
            renderElement: "shortText",
            required: true,
            validationRules: {
              regex: {
                pattern: emailRegex,
                errorMessage: t('templates.eventRegistration.emailInvalid')
              }
            }
          }), // config
      ] as Field,

      // Field 3: Organization (Required, Short Text)
      [
        'field', 
        generateFieldId(),
        'text', // dataType
        t('templates.eventRegistration.organizationQuestion'),
        '[]', // options
        '{"renderElement": "shortText", "required": true}', // config
      ] as Field,

      // Field 4: Days Attending (Required, Multiple Choice / Checkboxes)
      [
        'field', 
        generateFieldId(),
        'option', // dataType
        t('templates.eventRegistration.daysQuestion'),
        createOptionsString([
          [t('templates.eventRegistration.day1'), ""],
          [t('templates.eventRegistration.day2'), ""],
          [t('templates.eventRegistration.day3'), ""],
        ]), // options
        '{"renderElement": "checkboxes", "required": true}', // config
      ] as Field,

      // Field 5: Dietary Restrictions (Required, Single Choice / Radio Buttons)
      [
        'field', 
        generateFieldId(),
        'option', // dataType
        t('templates.eventRegistration.dietaryQuestion'),
        createOptionsString([
          [t('templates.eventRegistration.none'), ""],
          [t('templates.eventRegistration.vegetarian'), ""],
          [t('templates.eventRegistration.vegan'), ""],
          [t('templates.eventRegistration.kosher'), ""],
          [t('templates.eventRegistration.glutenFree'), ""],
          [t('templates.eventRegistration.other'), ""],
        ]), // options
        '{"renderElement": "radioButton", "required": true}', // config
      ] as Field,

      // Field 6: Payment Understanding (Required, Single Choice / Radio Button)
      [
        'field', 
        generateFieldId(),
        'option', // dataType
        t('templates.eventRegistration.paymentQuestion'),
        createOptionsString([
          [t('templates.eventRegistration.yes'), ""],
        ]), // options (Only "Yes")
        '{"renderElement": "radioButton", "required": true}', // config
      ] as Field,
    ],
  },
});

fieldCounter = 0;
optionCounter = 0;
