export const readAsStringAsync = jest
  .fn()
  .mockResolvedValue('mock-base64-string');

export const EncodingType = {
  Base64: 'base64',
  UTF8: 'utf8',
};

export default {
  readAsStringAsync,
  EncodingType,
};
