import { createBlankTemplate } from './blank';
import { createRsvpTemplate } from './rsvp';
import { createContactInfoTemplate } from './contactInfo';
import { createEventRegistrationTemplate } from './eventRegistration';
import { createPartyInviteTemplate } from './partyInvite';
import { FormTemplate } from './types';
import { TFunction } from 'i18next';

export const getAvailableTemplates = (t: TFunction): FormTemplate[] => [
  createBlankTemplate(t),
  createRsvpTemplate(t),
  createContactInfoTemplate(t),
  createPartyInviteTemplate(t),
  createEventRegistrationTemplate(t),
];

export * from './types';
