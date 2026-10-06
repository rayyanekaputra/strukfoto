
export const DEFAULTS = {
  width: '450', contrast: '1.8', brightness: '1.0', dither: 'bayer8',
  palette: 'cream', transparency: 'none', dropouts: '0.012', tear: true, fade: false,
  aspect: 'native', transparentBg: false, imagePos: 'top', watermarkFit: 'width', layout: 'album'
};

export const PALETTES = {
  cream: { paper: [242, 239, 233], ink: [32, 32, 30], paperHex: '#F2EFE9', inkHex: '#20201E' },
  aged: { paper: [235, 222, 190], ink: [50, 42, 35], paperHex: '#EBDEBE', inkHex: '#322A23' },
  blue: { paper: [240, 244, 248], ink: [25, 40, 90], paperHex: '#F0F4F8', inkHex: '#19285A' },
  bw: { paper: [255, 255, 255], ink: [0, 0, 0], paperHex: '#FFFFFF', inkHex: '#000000' },
  pink: { paper: [246, 220, 221], ink: [42, 34, 38], paperHex: '#F6DCDD', inkHex: '#2A2226' },
  canary: { paper: [247, 235, 160], ink: [43, 42, 34], paperHex: '#F7EBA0', inkHex: '#2B2A22' },
  greenbar: { paper: [233, 241, 228], ink: [30, 42, 34], paperHex: '#E9F1E4', inkHex: '#1E2A22' },
  kraft: { paper: [205, 176, 138], ink: [43, 32, 22], paperHex: '#CDB08A', inkHex: '#2B2016' },
  faded: { paper: [244, 242, 238], ink: [107, 106, 102], paperHex: '#F4F2EE', inkHex: '#6B6A66' },
  red: { paper: [184, 41, 47], ink: [244, 233, 216], paperHex: '#B8292F', inkHex: '#F4E9D8' }
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