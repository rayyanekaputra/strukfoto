
export const DEFAULTS = {
  width: '450', contrast: '1.8', brightness: '1.0', dither: 'bayer8',
  palette: 'cream', transparency: 'none', dropouts: '0.012', tear: true,
  aspect: 'native', transparentBg: false, imagePos: 'top', layout: 'album'
};

export const PALETTES = {
  cream: { paper: [242, 239, 233], ink: [32, 32, 30], paperHex: '#F2EFE9', inkHex: '#20201E' },
  aged: { paper: [235, 222, 190], ink: [50, 42, 35], paperHex: '#EBDEBE', inkHex: '#322A23' },
  blue: { paper: [240, 244, 248], ink: [25, 40, 90], paperHex: '#F0F4F8', inkHex: '#19285A' },
  bw: { paper: [255, 255, 255], ink: [0, 0, 0], paperHex: '#FFFFFF', inkHex: '#000000' }
};

export const BAYER_4X4 = [
  [0, 8, 2, 10], [12, 4, 14, 6],
  [3, 11, 1, 9], [15, 7, 13, 5]
];

export const BAYER_8X8 = [
  [0, 32, 8, 40, 2, 34, 10, 42], [48, 16, 56, 24, 50, 18, 58, 26],
  [12, 44, 4, 36, 14, 46, 6, 38], [60, 28, 52, 20, 62, 30, 54, 22],
  [3, 35, 11, 43, 1, 33, 9, 41], [51, 19, 59, 27, 49, 17, 57, 25],
  [15, 47, 7, 39, 13, 45, 5, 37], [63, 31, 55, 23, 61, 29, 53, 21]
];