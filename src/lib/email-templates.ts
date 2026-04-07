/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface EmailTemplateData {
  clientNaam: string;
  formattedBedrag: string;
  formattedWinst: string;
  formattedKenmerk: string;
  aanslagnummer: string;
  betaalDatumFormatted: string;
  winst: string;
}

const bankDetails = `Bankrekening: NL86 INGB 0002 4455 88
Ten name van: Belastingdienst
Betalingskenmerk: {formattedKenmerk}
BIC code: INGBNL2A`;

const bankDetailsEN = `Bank account number: NL86 INGB 0002 4455 88
Account holder: Belastingdienst
Payment reference: {formattedKenmerk}
BIC code: INGBNL2A`;

export function generateNLTemplate(data: EmailTemplateData): string {
  const salutation = data.clientNaam ? `Beste ${data.clientNaam},` : '';
  const winstLine = data.winst ? `Belastbare winst: ${data.formattedWinst}\n` : '';
  
  return `${salutation}${salutation ? '\n\n' : ''}Hierbij ontvangt u de gegevens voor de betaling van de belastingaanslag:

${winstLine}Bedrag: ${data.formattedBedrag}
Betalingskenmerk: ${data.formattedKenmerk}
Aanslagnummer: ${data.aanslagnummer}
Uiterste betaaldatum: ${data.betaalDatumFormatted || 'Nader te bepalen'}

Betaalgegevens:
${bankDetails.replace('{formattedKenmerk}', data.formattedKenmerk)}

U kunt dit bedrag overmaken naar de Belastingdienst onder vermelding van het bovenstaande betalingskenmerk.`;
}

export function generateENTemplate(data: EmailTemplateData): string {
  const salutation = data.clientNaam ? `Hi ${data.clientNaam},` : '';
  const winstLine = data.winst ? `Taxable profit: ${data.formattedWinst}\n` : '';

  return `${salutation}${salutation ? '\n\n' : ''}Please find the payment details for the tax assessment below:

${winstLine}Amount: ${data.formattedBedrag}
Payment reference: ${data.formattedKenmerk}
Assessment number: ${data.aanslagnummer}
Payment deadline: ${data.betaalDatumFormatted || '[DATE]'}

Payment details:
${bankDetailsEN.replace('{formattedKenmerk}', data.formattedKenmerk)}

You can transfer this amount to the Dutch Tax Authorities (Belastingdienst) using the payment reference mentioned above.`;
}
