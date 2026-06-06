// tuvi-engine.js — Tử Vi Đẩu Số Engine (ported from Python lasotuvi)
// Pure JavaScript, no external dependencies

// ============================================================
// CALENDAR CONVERSION (Lich_HND.py)
// ============================================================
const PI = Math.PI, DR = PI / 180;

export function jdFromDate(dd, mm, yy) {
  const a = Math.floor((14 - mm) / 12), y = yy + 4800 - a, m = mm + 12 * a - 3;
  let jd = dd + Math.floor((153 * m + 2) / 5) + 365 * y + Math.floor(y / 4) - Math.floor(y / 100) + Math.floor(y / 400) - 32045;
  if (jd < 2299161) jd = dd + Math.floor((153 * m + 2) / 5) + 365 * y + Math.floor(y / 4) - 32083;
  return jd;
}

export function jdToDate(jd) {
  let a, b, c;
  if (jd > 2299160) { a = jd + 32044; b = Math.floor((4 * a + 3) / 146097); c = a - Math.floor((b * 146097) / 4); }
  else { b = 0; c = jd + 32082; }
  const d = Math.floor((4 * c + 3) / 1461), e = c - Math.floor((1461 * d) / 4);
  const m = Math.floor((5 * e + 2) / 153);
  return [e - Math.floor((153 * m + 2) / 5) + 1, m + 3 - 12 * Math.floor(m / 10), b * 100 + d - 4800 + Math.floor(m / 10)];
}

function NewMoon(k) {
  const T = k / 1236.85, T2 = T * T, T3 = T2 * T;
  let Jd1 = 2415020.75933 + 29.53058868 * k + 0.0001178 * T2 - 0.000000155 * T3;
  Jd1 += 0.00033 * Math.sin((166.56 + 132.87 * T - 0.009173 * T2) * DR);
  const M = 359.2242 + 29.10535608 * k - 0.0000333 * T2 - 0.00000347 * T3;
  const Mpr = 306.0253 + 385.81691806 * k + 0.0107306 * T2 + 0.00001236 * T3;
  const F = 21.2964 + 390.67050646 * k - 0.0016528 * T2 - 0.00000239 * T3;
  let C1 = (0.1734 - 0.000393 * T) * Math.sin(M * DR) + 0.0021 * Math.sin(2 * DR * M);
  C1 -= 0.4068 * Math.sin(Mpr * DR) + 0.0161 * Math.sin(DR * 2 * Mpr);
  C1 -= 0.0004 * Math.sin(DR * 3 * Mpr);
  C1 += 0.0104 * Math.sin(DR * 2 * F) - 0.0051 * Math.sin(DR * (M + Mpr));
  C1 -= 0.0074 * Math.sin(DR * (M - Mpr)) + 0.0004 * Math.sin(DR * (2 * F + M));
  C1 -= 0.0004 * Math.sin(DR * (2 * F - M)) - 0.0006 * Math.sin(DR * (2 * F + Mpr));
  C1 += 0.0010 * Math.sin(DR * (2 * F - Mpr)) + 0.0005 * Math.sin(DR * (2 * Mpr + M));
  let deltat = (T < -11) ? 0.001 + 0.000839 * T + 0.0002261 * T2 - 0.00000845 * T3 - 0.000000081 * T * T3
    : -0.000278 + 0.000265 * T + 0.000262 * T2;
  return Jd1 + C1 - deltat;
}

function getSunLongitude(jdn, tz) {
  const T = (jdn - 2451545.5 - tz / 24) / 36525, T2 = T * T;
  const M = 357.52910 + 35999.05030 * T - 0.0001559 * T2 - 0.00000048 * T * T2;
  const L0 = 280.46645 + 36000.76983 * T + 0.0003032 * T2;
  let DL = (1.914600 - 0.004817 * T - 0.000014 * T2) * Math.sin(DR * M);
  DL += (0.019993 - 0.000101 * T) * Math.sin(DR * 2 * M) + 0.000290 * Math.sin(DR * 3 * M);
  let L = L0 + DL - 0.00569 - 0.00478 * Math.sin((125.04 - 1934.136 * T) * DR);
  L = L * DR;
  L = L - PI * 2 * Math.floor(L / (PI * 2));
  return Math.floor(L / PI * 6);
}

function getNewMoonDay(k, tz) { return Math.floor(NewMoon(k) + 0.5 + tz / 24); }

function getLunarMonth11(yy, tz) {
  const off = jdFromDate(31, 12, yy) - 2415021;
  let k = Math.floor(off / 29.530588853), nm = getNewMoonDay(k, tz);
  if (getSunLongitude(nm, tz) >= 9) nm = getNewMoonDay(k - 1, tz);
  return nm;
}

function getLeapMonthOffset(a11, tz) {
  const k = Math.floor((a11 - 2415021.076998695) / 29.530588853 + 0.5);
  let last = 0, i = 1, arc = getSunLongitude(getNewMoonDay(k + i, tz), tz);
  while (true) { last = arc; i++; arc = getSunLongitude(getNewMoonDay(k + i, tz), tz); if (!(arc !== last && i < 14)) break; }
  return i - 1;
}

export function S2L(dd, mm, yy, tz = 7) {
  const dn = jdFromDate(dd, mm, yy);
  const k = Math.floor((dn - 2415021.076998695) / 29.530588853);
  let ms = getNewMoonDay(k + 1, tz); if (ms > dn) ms = getNewMoonDay(k, tz);
  let a11 = getLunarMonth11(yy, tz), b11 = a11, lunarYear;
  if (a11 >= ms) { lunarYear = yy; a11 = getLunarMonth11(yy - 1, tz); }
  else { lunarYear = yy + 1; b11 = getLunarMonth11(yy + 1, tz); }
  const ld = dn - ms + 1, diff = Math.floor((ms - a11) / 29);
  let leap = 0, lm = diff + 11;
  if (b11 - a11 > 365) {
    const lmd = getLeapMonthOffset(a11, tz);
    if (diff >= lmd) { lm = diff + 10; if (diff === lmd) leap = 1; }
  }
  if (lm > 12) lm -= 12; if (lm >= 11 && diff < 4) lunarYear--;
  return [ld, lm, lunarYear, leap];
}

// ============================================================
// EARTHLY BRANCHES & HEAVENLY STEMS (AmDuong.py)
// ============================================================

export const diaChi = [
  null,
  { tenChi: "Tý", zodiac: "Tý", nguHanh: "Thủy", phuongHuong: "Bắc", amDuong: 1 },
  { tenChi: "Sửu", zodiac: "Sửu", nguHanh: "Thổ", phuongHuong: "Bắc", amDuong: -1 },
  { tenChi: "Dần", zodiac: "Dần", nguHanh: "Mộc", phuongHuong: "Đông", amDuong: 1 },
  { tenChi: "Mão", zodiac: "Mão", nguHanh: "Mộc", phuongHuong: "Đông", amDuong: -1 },
  { tenChi: "Thìn", zodiac: "Thìn", nguHanh: "Thổ", phuongHuong: "Đông Nam", amDuong: 1 },
  { tenChi: "Tỵ", zodiac: "Tỵ", nguHanh: "Hỏa", phuongHuong: "Đông Nam", amDuong: -1 },
  { tenChi: "Ngọ", zodiac: "Ngọ", nguHanh: "Hỏa", phuongHuong: "Nam", amDuong: 1 },
  { tenChi: "Mùi", zodiac: "Mùi", nguHanh: "Thổ", phuongHuong: "Nam", amDuong: -1 },
  { tenChi: "Thân", zodiac: "Thân", nguHanh: "Kim", phuongHuong: "Tây", amDuong: 1 },
  { tenChi: "Dậu", zodiac: "Dậu", nguHanh: "Kim", phuongHuong: "Tây", amDuong: -1 },
  { tenChi: "Tuất", zodiac: "Tuất", nguHanh: "Thổ", phuongHuong: "Tây Bắc", amDuong: 1 },
  { tenChi: "Hợi", zodiac: "Hợi", nguHanh: "Thủy", phuongHuong: "Tây Bắc", amDuong: -1 },
];

export const thienCan = [
  null,
  { tenCan: "Giáp", nguHanh: "Mộc", amDuong: 1 },
  { tenCan: "Ất", nguHanh: "Mộc", amDuong: -1 },
  { tenCan: "Bính", nguHanh: "Hỏa", amDuong: 1 },
  { tenCan: "Đinh", nguHanh: "Hỏa", amDuong: -1 },
  { tenCan: "Mậu", nguHanh: "Thổ", amDuong: 1 },
  { tenCan: "Kỷ", nguHanh: "Thổ", amDuong: -1 },
  { tenCan: "Canh", nguHanh: "Kim", amDuong: 1 },
  { tenCan: "Tân", nguHanh: "Kim", amDuong: -1 },
  { tenCan: "Nhâm", nguHanh: "Thủy", amDuong: 1 },
  { tenCan: "Quý", nguHanh: "Thủy", amDuong: -1 },
];

export function nguHanhNapAm(can, chi) {
  const napAm = [
    [null,"Hải trung kim","Lô trung hỏa","Đại lâm mộc","Lộ bàng thổ","Kiếm phong kim","Sơn đầu hỏa"],
    [null,"Giản hạ thủy","Thành đầu thổ","Bạch lạp kim","Dương liễu mộc","Tuyền trung thủy","Ốc thượng thổ"],
    [null,"Tích lịch hỏa","Tùng bách mộc","Trường lưu thủy","Sa trung kim","Sơn hạ hỏa","Bình địa mộc"],
    [null,"Bích thượng thổ","Kim bạch kim","Phú đăng hỏa","Thiên hà thủy","Đại dịch thổ","Thoa xuyến kim"],
    [null,"Tang đố mộc","Đại khê thủy","Sa trung thổ","Thiên thượng hỏa","Thạch lựu mộc","Đại hải thủy"],
  ];
  return napAm[((can - 1) % 5 + 5) % 5]?.[((chi - 1) % 6 + 6) % 6] || "";
}

export function timCuc(cungMenh, canNam) {
  const cucBang = [
    [null,2,3,4,5,6],[null,4,5,6,2,3],[null,5,6,2,3,4],
    [null,2,3,4,5,6],[null,3,4,5,6,2],[null,5,6,2,3,4],
    [null,2,3,4,5,6],[null,4,5,6,2,3],[null,5,6,2,3,4],
    [null,3,4,5,6,2],[null,5,6,2,3,4],[null,2,3,4,5,6],
  ];
  return cucBang[cungMenh]?.[((canNam - 1) % 5 + 1)] || 2;
}

export function nguHanh(so) {
  const map = { 1:"Thủy",2:"Thủy",3:"Mộc",4:"Kim",5:"Thổ",6:"Hỏa" };
  const ten = map[so] || "";
  const cucMap = {1:"Thủy nhị cục",2:"Mộc tam cục",3:"Kim tứ cục",4:"Thổ ngũ cục",5:"Hỏa lục cục"};
  return { so, ten, css: ten.toLowerCase(), cuc: cucMap[so] || "" };
}

export function dichCung(cungBD, ...args) {
  let kq = cungBD;
  for (const d of args) kq += d;
  return kq % 12 === 0 ? 12 : ((kq % 12) + 12) % 12 || 12;
}

export function khoangCachCung(c1, c2, chieu = 1) {
  return chieu === 1 ? (c1 - c2 + 12) % 12 : (c2 - c1 + 12) % 12;
}

export function canChiNgay(nn, tt, nnnn, duongLich = true, tz = 7) {
  let d = nn, m = tt, y = nnnn;
  if (duongLich) [d, m, y] = S2L(nn, tt, nnnn, tz);
  const jd = jdFromDate(d, m, y);
  return [(jd + 9) % 10 + 1, (jd + 1) % 12 + 1];
}

export function ngayThangNam(dd, mm, yy, duongLich = true, tz = 7) {
  if (duongLich) return [...S2L(dd, mm, yy, tz), 0];
  return [dd, mm, yy, 0];
}

export function ngayThangNamCanChi(nn, tt, nnnn, duongLich = true, tz = 7) {
  let d = nn, m = tt, y = nnnn, nhuan = 0;
  if (duongLich) [d, m, y, nhuan] = S2L(nn, tt, nnnn, tz);
  const canThang = (y * 12 + m + 3) % 10 + 1;
  const canNam = (y - 4) % 10 + 1;
  const chiNam = (y - 4) % 12 + 1;
  return [canThang, canNam, chiNam];
}

export function timTuVi(cucSo, ngayAm) {
  const viTri = [0, 5, 4, 3, 2, 1, 0][cucSo] || 0;
  let kq = ngayAm - viTri;
  while (kq % cucSo !== 0 || kq < 0) kq += cucSo;
  const vt = (kq / cucSo) % 12;
  return vt === 0 ? 12 : Math.floor(vt);
}

export function timHoaLinh(chiNam, gioSinh, gioiTinh, amDuongNam) {
  let idx = 0;
  if ([1,5,9].includes(chiNam)) idx = 1;
  else if ([6,10,2].includes(chiNam)) idx = 2;
  else if ([12,4,8].includes(chiNam)) idx = 3;
  const khoiH = [2, 3, 11, 10][idx];
  const khoiL = [4, 11, 4, 11][idx];
  if (gioiTinh * amDuongNam === -1) return [dichCung(khoiH + 1, -gioSinh), dichCung(khoiL - 1, gioSinh)];
  return [dichCung(khoiH - 1, gioSinh), dichCung(khoiL + 1, -gioSinh)];
}

// ============================================================
// STAR DATA (Sao.py)
// ============================================================

function Sao(id, ten, nguHanhVal, loai = 2, phuongVi = "", amDuong = "", vongTS = 0) {
  return { saoID: id, saoTen: ten, saoNguHanh: nguHanhVal, saoLoai: loai, saoPhuongVi: phuongVi, saoAmDuong: amDuong, vongTrangSinh: vongTS };
}

export const SAO = {};
SAO.tuVi = Sao(1, "Tử vi", "Thổ", 1, "Đế tinh", "Dương");
SAO.liemTrinh = Sao(2, "Liêm trinh", "Hỏa", 1, "Bắc đẩu tinh", "Dương");
SAO.thienDong = Sao(3, "Thiên đồng", "Thủy", 1, "Bắc đẩu tinh", "Dương");
SAO.vuKhuc = Sao(4, "Vũ khúc", "Kim", 1, "Bắc đẩu tinh", "Âm");
SAO.thaiDuong = Sao(5, "Thái dương", "Hỏa", 1, "Nam đẩu tinh", "Dương");
SAO.thienCo = Sao(6, "Thiên cơ", "Mộc", 1, "Nam đẩu tinh", "Âm");
SAO.thienPhu = Sao(7, "Thiên phủ", "Thổ", 1, "Nam đẩu tinh", "Dương");
SAO.thaiAm = Sao(8, "Thái âm", "Thủy", 1, "Bắc đẩu tinh", "Âm");
SAO.thamLang = Sao(9, "Tham lang", "Thủy", 1, "Bắc đẩu tinh", "Âm");
SAO.cuMon = Sao(10, "Cự môn", "Thủy", 1, "Bắc đẩu tinh", "Âm");
SAO.thienTuong = Sao(11, "Thiên tướng", "Thủy", 1, "Nam đẩu tinh", "Dương");
SAO.thienLuong = Sao(12, "Thiên lương", "Mộc", 1, "Nam đẩu tinh", "Âm");
SAO.thatSat = Sao(13, "Thất sát", "Kim", 1, "Nam đẩu tinh", "Dương");
SAO.phaQuan = Sao(14, "Phá quân", "Thủy", 1, "Bắc đẩu tinh", "Âm");
SAO.thaiTue = Sao(15, "Thái tuế", "Hỏa", 15);
SAO.thieuDuong = Sao(16, "Thiếu dương", "Hỏa", 5);
SAO.tangMon = Sao(17, "Tang môn", "Mộc", 12);
SAO.thieuAm = Sao(18, "Thiếu âm", "Thủy", 5);
SAO.quanPhu = Sao(19, "Quan phù", "Hỏa", 12);
SAO.tuPhu = Sao(20, "Tử phù", "Kim", 12);
SAO.tuePha = Sao(21, "Tuế phá", "Hỏa", 12);
SAO.longDuc = Sao(22, "Long đức", "Thủy", 5);
SAO.bachHo = Sao(23, "Bạch hổ", "Kim", 12);
SAO.phucDucTT = Sao(24, "Phúc đức", "Thổ", 5);
SAO.dieuKhach = Sao(25, "Điếu khách", "Hỏa", 12);
SAO.trucPhu = Sao(26, "Trực phù", "Kim", 16);
SAO.locTon = Sao(27, "Lộc tồn", "Thổ", 3, "Bắc đẩu tinh");
SAO.bacSy = Sao(109, "Bác sỹ", "Thủy", 5);
SAO.lucSi = Sao(28, "Lực sĩ", "Hỏa");
SAO.thanhLong = Sao(29, "Thanh long", "Thủy", 5);
SAO.tieuHao = Sao(30, "Tiểu hao", "Hỏa", 12);
SAO.tuongQuan = Sao(31, "Tướng quân", "Mộc", 4);
SAO.tauThu = Sao(32, "Tấu thư", "Kim", 3);
SAO.phiLiem = Sao(33, "Phi liêm", "Hỏa");
SAO.hyThan = Sao(34, "Hỷ thần", "Hỏa", 5);
SAO.benhPhu = Sao(35, "Bệnh phù", "Thổ", 12);
SAO.daiHao = Sao(36, "Đại hao", "Hỏa", 12);
SAO.phucBinh = Sao(37, "Phục binh", "Hỏa", 13);
SAO.trangSinh = Sao(39, "Tràng sinh", "Thủy", 5, "", "", 1);
SAO.mocDuc = Sao(40, "Mộc dục", "Thủy", 14, "", "", 1);
SAO.quanDoi = Sao(41, "Quan đới", "Kim", 4, "", "", 1);
SAO.lamQuan = Sao(42, "Lâm quan", "Kim", 7, "", "", 1);
SAO.deVuong = Sao(43, "Đế vượng", "Kim", 5, "", "", 1);
SAO.suy = Sao(44, "Suy", "Thủy", 12, "", "", 1);
SAO.benh = Sao(45, "Bệnh", "Hỏa", 12, "", "", 1);
SAO.tu = Sao(46, "Tử", "Hỏa", 12, "", "", 1);
SAO.mo = Sao(47, "Mộ", "Thổ", 2, "", "", 1);
SAO.tuyet = Sao(48, "Tuyệt", "Thổ", 12, "", "", 1);
SAO.thai = Sao(49, "Thai", "Thổ", 14, "", "", 1);
SAO.duong = Sao(50, "Dưỡng", "Mộc", 2, "", "", 1);
SAO.daLa = Sao(51, "Đà la", "Kim", 11);
SAO.kinhDuong = Sao(52, "Kình dương", "Kim", 11);
SAO.diaKhong = Sao(53, "Địa không", "Hỏa", 11);
SAO.diaKiep = Sao(54, "Địa kiếp", "Hỏa", 11);
SAO.linhTinh = Sao(55, "Linh tinh", "Hỏa", 11);
SAO.hoaTinh = Sao(56, "Hỏa tinh", "Hỏa", 11);
SAO.vanXuong = Sao(57, "Văn xương", "Kim", 6);
SAO.vanKhuc = Sao(58, "Văn khúc", "Thủy", 6);
SAO.thienKhoi = Sao(59, "Thiên khôi", "Hỏa", 6);
SAO.thienViet = Sao(60, "Thiên việt", "Hỏa", 6);
SAO.taPhu = Sao(61, "Tả phù", "Thổ");
SAO.huuBat = Sao(62, "Hữu bật", "Thổ");
SAO.longTri = Sao(63, "Long trì", "Thủy", 3);
SAO.phuongCac = Sao(64, "Phượng các", "Thổ", 3);
SAO.tamThai = Sao(65, "Tam thai", "Mộc", 7);
SAO.batToa = Sao(66, "Bát tọa", "Thủy", 7);
SAO.anQuang = Sao(67, "Ân quang", "Mộc", 3);
SAO.thienQuy = Sao(68, "Thiên quý", "Thổ", 3);
SAO.thienKhoc = Sao(69, "Thiên khốc", "Thủy", 12);
SAO.thienHu = Sao(70, "Thiên hư", "Thủy", 12);
SAO.thienDuc = Sao(71, "Thiên đức", "Hỏa", 5);
SAO.nguyetDuc = Sao(72, "Nguyệt đức", "Hỏa", 5);
SAO.thienHinh = Sao(73, "Thiên hình", "Hỏa", 15);
SAO.thienRieu = Sao(74, "Thiên riêu", "Thủy", 13);
SAO.thienY = Sao(75, "Thiên y", "Thủy", 5);
SAO.quocAn = Sao(76, "Quốc ấn", "Thổ", 6);
SAO.duongPhu = Sao(77, "Đường phù", "Mộc", 4);
SAO.daoHoa = Sao(78, "Đào hoa", "Mộc", 8);
SAO.hongLoan = Sao(79, "Hồng loan", "Thủy", 8);
SAO.thienHy = Sao(80, "Thiên hỷ", "Thủy", 5);
SAO.thienGiai = Sao(81, "Thiên giải", "Hỏa", 5);
SAO.diaGiai = Sao(82, "Địa giải", "Thổ", 5);
SAO.giaiThan = Sao(83, "Giải thần", "Mộc", 5);
SAO.thaiPhu = Sao(84, "Thai phụ", "Kim", 6);
SAO.phongCao = Sao(85, "Phong cáo", "Thổ", 4);
SAO.thienTai = Sao(86, "Thiên tài", "Thổ");
SAO.thienTho = Sao(87, "Thiên thọ", "Thổ", 5);
SAO.thienThuong = Sao(88, "Thiên thương", "Thổ", 12);
SAO.thienSu = Sao(89, "Thiên sứ", "Thủy", 12);
SAO.thienLa = Sao(90, "Thiên la", "Thổ", 12);
SAO.diaVong = Sao(91, "Địa võng", "Thổ", 12);
SAO.hoaKhoa = Sao(92, "Hóa khoa", "Thủy", 5);
SAO.hoaQuyen = Sao(93, "Hóa quyền", "Thủy", 4);
SAO.hoaLoc = Sao(94, "Hóa lộc", "Mộc", 3);
SAO.hoaKy = Sao(95, "Hóa kỵ", "Thủy", 13);
SAO.coThan = Sao(96, "Cô thần", "Thổ", 13);
SAO.quaTu = Sao(97, "Quả tú", "Thổ", 13);
SAO.thienMa = Sao(98, "Thiên mã", "Hỏa", 3);
SAO.phaToai = Sao(99, "Phá toái", "Hỏa", 12);
SAO.thienQuan = Sao(100, "Thiên quan", "Hỏa", 5);
SAO.thienPhuc = Sao(101, "Thiên phúc", "Hỏa", 5);
SAO.luuHa = Sao(102, "Lưu hà", "Thủy", 12);
SAO.thienTru = Sao(103, "Thiên trù", "Thổ", 5);
SAO.kiepSat = Sao(104, "Kiếp sát", "Hỏa", 11);
SAO.hoaCai = Sao(105, "Hoa cái", "Kim", 14);
SAO.vanTinh = Sao(106, "Văn tinh", "Hỏa", 6);
SAO.dauQuan = Sao(107, "Đẩu quân", "Hỏa", 5);
SAO.thienKhong = Sao(108, "Thiên không", "Thủy", 11);

// ============================================================
// BIRTH CHART CONSTRUCTION (App.py + DiaBan.py)
// ============================================================

const CUNG_NAMES = ["Mệnh","Phụ Mẫu","Phúc Đức","Điền Trạch","Quan Lộc","Nô Bộc","Thiên Di","Tật Ách","Tài Bạch","Tử Tức","Phu Thê","Huynh Đệ"];
const ZODIAC = ["","Tý","Sửu","Dần","Mão","Thìn","Tỵ","Ngọ","Mùi","Thân","Dậu","Tuất","Hợi"];
const SAO_CHINH_SET = new Set(["Tử vi","Thiên cơ","Thái dương","Vũ khúc","Thiên đồng","Liêm trinh","Thiên phủ","Thái âm","Tham lang","Cự môn","Thiên tướng","Thiên lương","Thất sát","Phá quân"]);

// Đặc tính sao theo cung (Vượng/Miếu/Đắc/Bình/Hãm) - đơn giản hóa
function getDacTinh(saoID, cungSo) {
  const dt = {
    1: ["","Đ","M","V","B","M","B","B","M","Đ","M","B","V"], // Tử vi
    2: ["","V","Đ","V","H","M","H","V","Đ","V","H","M","H"], // Liêm trinh
    3: ["","V","H","M","Đ","H","Đ","H","H","M","H","Đ","H"], // Thiên đồng
    4: ["","V","M","V","Đ","M","H","V","M","V","Đ","M","H"], // Vũ khúc
    5: ["","H","Đ","V","V","V","M","M","Đ","H","H","Đ","M"], // Thái dương
    6: ["","Đ","Đ","H","M","M","V","Đ","Đ","V","M","M","H"], // Thiên cơ
    8: ["","V","Đ","H","H","H","H","H","Đ","V","M","M","V"], // Thái âm
    9: ["","H","M","Đ","H","V","H","H","M","Đ","H","V","H"], // Tham lang
    10:["","V","H","V","M","H","H","V","H","Đ","M","H","Đ"], // Cự môn
    11:["","V","Đ","M","H","V","Đ","V","Đ","M","H","Đ","M"], // Thiên tướng
    12:["","V","Đ","V","V","M","H","M","Đ","V","H","Đ","H"], // Thiên lương
    13:["","M","Đ","M","H","H","V","M","Đ","M","H","H","V"], // Thất sát
    14:["","M","V","H","H","Đ","H","M","V","H","H","Đ","H"], // Phá quân
    51:["","H","Đ","H","H","Đ","H","H","Đ","H","H","Đ","H"], // Đà la
    52:["","H","Đ","H","H","Đ","H","H","Đ","H","H","Đ","H"], // Kình dương
  };
  return dt[saoID]?.[cungSo] || "";
}

function createCung(i) {
  return { cungSo: i, zodiac: ZODIAC[i], cungSao: [], cungDaiHan: 0 };
}

function nhapSao(cung, sao) {
  const dacTinh = getDacTinh(sao.saoID, cung.cungSo);
  cung.cungSao.push({ ...sao, saoDacTinh: dacTinh });
}

export function lapDiaBan(nn, tt, nnnn, gioSinh, gioiTinh, duongLich = true, timeZone = 7) {
  // Convert to lunar
  let nAm = nn, tAm = tt, namAm = nnnn, thangNhuan = 0;
  if (duongLich) [nAm, tAm, namAm, thangNhuan] = S2L(nn, tt, nnnn, timeZone);
  
  // Can chi
  const [canThang, canNam, chiNam] = ngayThangNamCanChi(nn, tt, nnnn, duongLich, timeZone);
  const [canNgay, chiNgay] = canChiNgay(nn, tt, nnnn, duongLich, timeZone);
  
  // Create 12 cung
  const thapNhiCung = Array(13).fill(null);
  for (let i = 1; i <= 12; i++) thapNhiCung[i] = createCung(i);
  
  // Calculate cung Mệnh and cung Thân
  const cungMenh = dichCung(3, tAm - 1, -(gioSinh) + 1);
  const cungThan = dichCung(3, tAm - 1, gioSinh - 1);
  
  // Cuc
  const amDuongNam = thienCan[canNam].amDuong;
  const hanhCuc = timCuc(cungMenh, canNam);
  const cuc = nguHanh(hanhCuc);
  
  // Đại hạn
  const chieuDH = gioiTinh * diaChi[chiNam].amDuong;
  for (let i = 0; i < 12; i++) {
    const cungIdx = chieuDH === 1 ? ((cungMenh + i - 1) % 12) + 1 : ((cungMenh - i + 11) % 12) + 1;
    thapNhiCung[cungIdx].cungDaiHan = cuc.so + i * 10;
  }
  
  // Place Tử vi
  const vtTuVi = timTuVi(cuc.so, nAm);
  nhapSao(thapNhiCung[vtTuVi], SAO.tuVi);
  
  // Tử vi tinh hệ
  nhapSao(thapNhiCung[dichCung(vtTuVi, 4)], SAO.liemTrinh);
  nhapSao(thapNhiCung[dichCung(vtTuVi, 7)], SAO.thienDong);
  nhapSao(thapNhiCung[dichCung(vtTuVi, 8)], SAO.vuKhuc);
  nhapSao(thapNhiCung[dichCung(vtTuVi, 9)], SAO.thaiDuong);
  nhapSao(thapNhiCung[dichCung(vtTuVi, 11)], SAO.thienCo);
  
  // Thiên phủ tinh hệ
  const vtThienPhu = dichCung(3, 3 - vtTuVi);
  nhapSao(thapNhiCung[vtThienPhu], SAO.thienPhu);
  nhapSao(thapNhiCung[dichCung(vtThienPhu, 1)], SAO.thaiAm);
  nhapSao(thapNhiCung[dichCung(vtThienPhu, 2)], SAO.thamLang);
  nhapSao(thapNhiCung[dichCung(vtThienPhu, 3)], SAO.cuMon);
  nhapSao(thapNhiCung[dichCung(vtThienPhu, 4)], SAO.thienTuong);
  nhapSao(thapNhiCung[dichCung(vtThienPhu, 5)], SAO.thienLuong);
  nhapSao(thapNhiCung[dichCung(vtThienPhu, 6)], SAO.thatSat);
  nhapSao(thapNhiCung[dichCung(vtThienPhu, 10)], SAO.phaQuan);
  
  // Vòng Thái tuế
  const vtThaiTue = chiNam;
  const ringThaiTue = [SAO.thaiTue,SAO.thieuDuong,SAO.tangMon,SAO.thieuAm,SAO.quanPhu,SAO.tuPhu,SAO.tuePha,SAO.longDuc,SAO.bachHo,SAO.phucDucTT,SAO.dieuKhach,SAO.trucPhu];
  for (let i = 0; i < 12; i++) nhapSao(thapNhiCung[dichCung(vtThaiTue, i)], ringThaiTue[i]);
  
  // Lộc tồn
  const vtLocTon = [null, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12][canNam] || 3;
  nhapSao(thapNhiCung[vtLocTon], SAO.locTon);
  const ringLocTon = [SAO.bacSy,SAO.lucSi,SAO.thanhLong,SAO.tieuHao,SAO.tuongQuan,SAO.tauThu,SAO.phiLiem,SAO.hyThan,SAO.benhPhu,SAO.daiHao,SAO.phucBinh,SAO.quanPhu];
  for (let i = 0; i < 12; i++) nhapSao(thapNhiCung[dichCung(vtLocTon, i, -1)], ringLocTon[i]);
  
  // Vòng Tràng sinh
  const vtTrangSinh = gioiTinh * amDuongNam === 1 ? dichCung(3, cuc.so - 2) : dichCung(3, -(cuc.so - 2));
  const ringTS = [SAO.trangSinh,SAO.mocDuc,SAO.quanDoi,SAO.lamQuan,SAO.deVuong,SAO.suy,SAO.benh,SAO.tu,SAO.mo,SAO.tuyet,SAO.thai,SAO.duong];
  for (let i = 0; i < 12; i++) {
    nhapSao(thapNhiCung[dichCung(vtTrangSinh, gioiTinh * amDuongNam === 1 ? i : -i)], ringTS[i]);
  }
  
  // Lục sát
  nhapSao(thapNhiCung[dichCung(chiNam, 3)], SAO.kinhDuong);
  nhapSao(thapNhiCung[dichCung(chiNam, 9)], SAO.daLa);
  nhapSao(thapNhiCung[dichCung(chiNam, 1)], SAO.diaKhong);
  nhapSao(thapNhiCung[dichCung(chiNam, 7)], SAO.diaKiep);
  
  const [vtHoaTinh, vtLinhTinh] = timHoaLinh(chiNam, gioSinh, gioiTinh, amDuongNam);
  nhapSao(thapNhiCung[vtHoaTinh], SAO.hoaTinh);
  nhapSao(thapNhiCung[vtLinhTinh], SAO.linhTinh);
  
  // Văn tinh
  nhapSao(thapNhiCung[dichCung(chiNam, 9)], SAO.vanXuong);
  nhapSao(thapNhiCung[dichCung(5, gioSinh - 1)], SAO.vanKhuc);
  
  const vtThienKhoi = [null,2,1,12,10,8,1,8,7,6,4][canNam]||2;
  const vtThienViet = [null,8,7,6,4,2,7,2,1,12,10][canNam]||8;
  nhapSao(thapNhiCung[vtThienKhoi], SAO.thienKhoi);
  nhapSao(thapNhiCung[vtThienViet], SAO.thienViet);
  
  nhapSao(thapNhiCung[dichCung(chiNam, 1)], SAO.taPhu);
  nhapSao(thapNhiCung[dichCung(chiNam, 11)], SAO.huuBat);
  
  // Sao đôi
  nhapSao(thapNhiCung[dichCung(chiNam, 1)], SAO.thienKhoc);
  nhapSao(thapNhiCung[dichCung(chiNam, 7)], SAO.thienHu);
  
  nhapSao(thapNhiCung[dichCung(chiNam, 9)], SAO.daoHoa);
  nhapSao(thapNhiCung[dichCung(chiNam, 3)], SAO.hongLoan);
  nhapSao(thapNhiCung[dichCung(chiNam, 3)], SAO.thienHy);
  
  nhapSao(thapNhiCung[dichCung(chiNam, 4)], SAO.thienHinh);
  nhapSao(thapNhiCung[dichCung(chiNam, 9)], SAO.thienRieu);
  nhapSao(thapNhiCung[dichCung(chiNam, 10)], SAO.thienY);
  
  nhapSao(thapNhiCung[dichCung(chiNam, 4)], SAO.thienGiai);
  nhapSao(thapNhiCung[dichCung(chiNam, 6)], SAO.diaGiai);
  
  nhapSao(thapNhiCung[dichCung(chiNam, 7)], SAO.giaiThan);
  nhapSao(thapNhiCung[dichCung(chiNam, 5)], SAO.thienTai);
  nhapSao(thapNhiCung[dichCung(chiNam, 4)], SAO.thienTho);
  
  nhapSao(thapNhiCung[dichCung(chiNam, 1)], SAO.coThan);
  nhapSao(thapNhiCung[dichCung(chiNam, 7)], SAO.quaTu);
  
  nhapSao(thapNhiCung[dichCung(chiNam, 6)], SAO.phongCao);
  nhapSao(thapNhiCung[dichCung(chiNam, 2)], SAO.thaiPhu);
  
  nhapSao(thapNhiCung[dichCung(chiNam, 2)], SAO.tamThai);
  nhapSao(thapNhiCung[dichCung(chiNam, 8)], SAO.batToa);
  
  nhapSao(thapNhiCung[dichCung(chiNam, 3)], SAO.longTri);
  nhapSao(thapNhiCung[dichCung(chiNam, 9)], SAO.phuongCac);
  
  nhapSao(thapNhiCung[dichCung(canNam, 2)], SAO.thienQuan);
  nhapSao(thapNhiCung[dichCung(canNam, 3)], SAO.thienPhuc);
  
  // Tuần and Triệt
  const vtTuan = dichCung(chiNam, 10 - (namAm % 10 || 10));
  const vtTriet = dichCung(chiNam, 4 - (namAm % 10 || 10));
  
  // Đẩu quân
  nhapSao(thapNhiCung[dichCung(chiNam, -tAm + gioSinh)], SAO.dauQuan);
  
  // Thiên mã
  nhapSao(thapNhiCung[dichCung(chiNam, 6)], SAO.thienMa);
  
  // Hóa lộc, quyền, khoa, kỵ
  const hoaLocMap = [null,2,3,4,5,6,3,4,5,6,1][canNam]||2;
  const hoaQuyenMap = [null,6,1,2,3,4,1,2,3,4,5][canNam]||6;
  const hoaKhoaMap = [null,3,4,5,6,1,4,5,6,1,2][canNam]||3;
  const hoaKyMap = [null,4,5,6,1,2,4,5,6,1,3][canNam]||4;
  nhapSao(thapNhiCung[dichCung(hoaLocMap, 3, 1)], SAO.hoaLoc);
  nhapSao(thapNhiCung[dichCung(hoaQuyenMap, 3, 1)], SAO.hoaQuyen);
  nhapSao(thapNhiCung[dichCung(hoaKhoaMap, 3, 1)], SAO.hoaKhoa);
  nhapSao(thapNhiCung[dichCung(hoaKyMap, 3, 1)], SAO.hoaKy);
  
  // Note: ctTuan and ctTriet are placeholders for the marker logic
  // The actual Tuần/Triệt markers would be set during rendering
  
  return {
    thapNhiCung,
    cungMenh,
    cungThan,
    cuc,
    hanhCuc,
    canNam,
    chiNam,
    canThang,
    canNgay,
    chiNgay,
    amDuongNam,
    nAm,
    tAm,
    namAm,
    thangNhuan,
    vtTuan,
    vtTriet,
  };
}

export function lapThienBan(nn, tt, nnnn, gioSinh, gioiTinh, ten, diaBan) {
  const chiGio = diaChi[gioSinh];
  const canGio = ((jdFromDate(nn, tt, nnnn) - 1) * 2 % 10 + gioSinh) % 10 + 1;
  
  const [canThang, canNam, chiNam] = ngayThangNamCanChi(nn, tt, nnnn, true, 7);
  const [canNgay, chiNgay] = canChiNgay(nn, tt, nnnn, true, 7);
  
  const banMenh = nguHanhNapAm(canNam, chiNam);
  const amDuongNamSinh = thienCan[canNam].amDuong === 1 ? "Dương" : "Âm";
  const amDuongMenh = diaChi[diaBan.cungMenh].amDuong === 1 ? "Dương" : "Âm";
  
  // Mệnh chủ, Thân chủ
  const menhChuMap = [null,"Tham lang","Cự môn","Lộc tồn","Văn khúc","Liêm trinh","Vũ khúc","Phá quân","Văn xương","Thái âm","Thái dương","Thiên đồng","Thiên cơ","Tử vi"];
  const thanChuMap = [null,"Linh tinh","Thiên tướng","Thiên lương","Thiên đồng","Văn xương","Văn khúc","Thiên phủ","Thái âm","Thiên cơ","Cự môn","Tham lang","Thái dương","Hỏa tinh"];
  
  return {
    gioiTinh: gioiTinh,
    namNu: gioiTinh === 1 ? "Nam" : "Nữ",
    chiGioSinh: chiGio?.tenChi || "",
    canGioSinh: thienCan[canGio]?.tenCan || "",
    gioSinh: `${thienCan[canGio]?.tenCan||""} ${chiGio?.tenChi||""}`,
    banMenh,
    menhChu: menhChuMap[diaBan.cungMenh] || "",
    thanChu: thanChuMap[diaBan.cungThan] || "",
    hanhCuc: diaBan.cuc.so,
    amDuongNamSinh,
    amDuongMenh,
    canNamTen: thienCan[canNam]?.tenCan || "",
    chiNamTen: diaChi[chiNam]?.tenChi || "",
    canThangTen: thienCan[canThang]?.tenCan || "",
    chiThangTen: diaChi[diaBan.tAm]?.tenChi || "",
    canNgayTen: thienCan[canNgay]?.tenCan || "",
    chiNgayTen: diaChi[chiNgay]?.tenChi || "",
    ten,
  };
}
