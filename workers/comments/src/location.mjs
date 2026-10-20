// Cloudflare supplies these network-derived values on the incoming Request.
// Keep only a coarse display label, never the address, city or coordinates.
const provinces = {
  AH: '安徽', BJ: '北京', CQ: '重庆', FJ: '福建', GD: '广东', GS: '甘肃', GX: '广西', GZ: '贵州',
  HA: '河南', HB: '湖北', HE: '河北', HI: '海南', HL: '黑龙江', HN: '湖南', JL: '吉林', JS: '江苏',
  JX: '江西', LN: '辽宁', NM: '内蒙古', NX: '宁夏', QH: '青海', SC: '四川', SD: '山东', SH: '上海',
  SN: '陕西', SX: '山西', TJ: '天津', XJ: '新疆', XZ: '西藏', YN: '云南', ZJ: '浙江',
  HK: '香港', MO: '澳门', TW: '台湾'
};
const numericCodes = {
  11: 'BJ', 12: 'TJ', 13: 'HE', 14: 'SX', 15: 'NM', 21: 'LN', 22: 'JL', 23: 'HL',
  31: 'SH', 32: 'JS', 33: 'ZJ', 34: 'AH', 35: 'FJ', 36: 'JX', 37: 'SD', 41: 'HA',
  42: 'HB', 43: 'HN', 44: 'GD', 45: 'GX', 46: 'HI', 50: 'CQ', 51: 'SC', 52: 'GZ',
  53: 'YN', 54: 'XZ', 61: 'SN', 62: 'GS', 63: 'QH', 64: 'NX', 65: 'XJ', 71: 'TW', 81: 'HK', 82: 'MO'
};
const countries = new Intl.DisplayNames(['zh-CN'], { type: 'region' });
export function ipLocation(cf) {
  if (!cf || typeof cf.country !== 'string') return '';
  const country = cf.country.toUpperCase();
  if (!/^[A-Z]{2}$/.test(country) || ['XX', 'ZZ'].includes(country)) return '';
  if (['HK', 'MO', 'TW'].includes(country)) return provinces[country];
  if (country === 'CN') {
    const region = String(cf.regionCode || '').toUpperCase().replace(/^CN-/, '');
    return provinces[numericCodes[region] || region] || '中国';
  }
  const name = countries.of(country);
  return name && name !== country ? name : '';
}
