export const manipulateAsync = jest.fn().mockResolvedValue({
  uri: 'file:///path/to/compressed/image.jpg',
  width: 1024,
  height: 768,
});

export const SaveFormat = {
  JPEG: 'jpeg',
  PNG: 'png',
  WEBP: 'webp',
};

export default {
  manipulateAsync,
  SaveFormat,
};
