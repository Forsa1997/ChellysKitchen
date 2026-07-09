// Betreiberangaben für Impressum und Datenschutzerklärung.
// ▸ Bitte einmal ausfüllen (Pflichtangaben nach § 5 DDG / § 18 MStV).
//   Solange die Platzhalter unten stehen, weisen die Seiten sichtbar darauf
//   hin, dass die Angaben noch ergänzt werden müssen.

// Platzhalter, an denen erkannt wird, dass ein Feld noch nicht ausgefüllt ist.
const PLACEHOLDERS = new Set([
  'Vorname Nachname',
  'Straße und Hausnummer',
  'PLZ',
  'Ort',
  'kontakt@chellys-kitchen.de',
]);

export const siteOperator = {
  name: 'Michelle Zboron',
  street: 'An der Junkernwiese 38',
  postalCode: '30926',
  city: 'Seelze',
  country: 'Deutschland',
  email: 'chellyzboron@t-online.de',
  // Optional: Telefonnummer (leer lassen, wenn nicht gewünscht).
  phone: '',
};

/** True, solange in den Pflichtfeldern noch Platzhalter stehen. */
export function operatorNeedsCompletion(operator = siteOperator): boolean {
  return [operator.name, operator.street, operator.postalCode, operator.city, operator.email]
    .some((value) => value.trim() === '' || PLACEHOLDERS.has(value.trim()));
}
