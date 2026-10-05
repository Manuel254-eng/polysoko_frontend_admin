// Cleave options for <Textinput isMask :options="AMOUNT_MASK">: shows "12,500.50"
// while the v-model receives the raw "12500.50", so payloads need no stripping.
export const AMOUNT_MASK = {
  numeral: true,
  numeralThousandsGroupStyle: "thousand",
  numeralDecimalScale: 2,
  numeralPositiveOnly: true,
};
