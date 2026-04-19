import { FormTemplate } from './types';
import { Field } from '../nostr/types';
import { TFunction } from 'i18next';

let fieldCounter = 0;
const generateFieldId = (): string => `template_field_${Date.now()}_${fieldCounter++}`;

const emailRegex = "^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$";

export const createContactInfoTemplate = (t: TFunction): FormTemplate => ({
  id: 'contactInfo',
  name: t('templates.contactInfo.name'),
  description: t('templates.contactInfo.description'),
  initialState: {
    formName: t('templates.contactInfo.formName'),
    formSettings: {
      description: t('templates.contactInfo.formDescription'),
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
        t('templates.contactInfo.nameQuestion'),
        '[]', // options
        '{"renderElement": "shortText", "required": true}', // config
      ] as Field,

      // Field 2: Email (Required, Short Text, with validation)
      [
        'field', 
        generateFieldId(),
        'text', // dataType
        t('templates.contactInfo.emailQuestion'),
        '[]', // options
        JSON.stringify({ // Stringify the config object
          renderElement: "shortText",
          required: true,
          validationRules: {
            regex: {
              pattern: emailRegex,
              errorMessage: t('templates.contactInfo.emailInvalid')
            }
          }
        }), // config
      ] as Field,

      // Field 3: Address (Required, Paragraph)
      [
        'field', 
        generateFieldId(),
        'text', // dataType
        t('templates.contactInfo.addressQuestion'),
        '[]', // options
        '{"renderElement": "paragraph", "required": true}', // config (Assuming 'paragraph' exists)
      ] as Field,

      // Field 4: Phone number (Not Required, Short Text)
      [
        'field', 
        generateFieldId(),
        'text', // dataType
        t('templates.contactInfo.phoneQuestion'),
        '[]', // options
        '{"renderElement": "shortText", "required": false}', // config
      ] as Field,

       // Field 5: Comments (Not Required, Paragraph)
       [
        'field', 
        generateFieldId(),
        'text', // dataType
        t('templates.contactInfo.commentsQuestion'),
        '[]', // options
        '{"renderElement": "paragraph", "required": false}', // config (Assuming 'paragraph' exists)
      ] as Field,
    ],
  },
});

fieldCounter = 0;
