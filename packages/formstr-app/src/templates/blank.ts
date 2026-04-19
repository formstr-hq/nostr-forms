import { FormTemplate } from './types';
import { Field } from '../nostr/types'; 
import { TFunction } from 'i18next';

let fieldCounter = 0;
const generateFieldId = (): string => `template_field_${Date.now()}_${fieldCounter++}`;

export const createBlankTemplate = (t: TFunction): FormTemplate => ({
  id: 'blank',
  name: t('templates.blank.name'),
  description: t('templates.blank.description'),
  initialState: {
    formName: t('templates.blank.formName'),
    formSettings: {
      description: t('templates.blank.formDescription'),
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
        'text',
        t('templates.blank.questionLabel'),
        '[]',
        '{"renderElement": "shortText"}',
      ] as Field,
    ],
  },
});

fieldCounter = 0;
