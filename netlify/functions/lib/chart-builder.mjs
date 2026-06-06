// Build chart JSON from diaBan and thienBan (same output as Python build_chart)
const CUNG_NAMES = ["Mệnh","Phụ Mẫu","Phúc Đức","Điền Trạch","Quan Lộc","Nô Bộc","Thiên Di","Tật Ách","Tài Bạch","Tử Tức","Phu Thê","Huynh Đệ"];
const ZODIAC = ["","Tý","Sửu","Dần","Mão","Thìn","Tỵ","Ngọ","Mùi","Thân","Dậu","Tuất","Hợi"];
const SAO_CHINH_SET = new Set(["Tử vi","Thiên cơ","Thái dương","Vũ khúc","Thiên đồng","Liêm trinh","Thiên phủ","Thái âm","Tham lang","Cự môn","Thiên tướng","Thiên lương","Thất sát","Phá quân"]);

export function buildChartJSON(db, tb, nam, thang, ngay, gio, gioi_tinh) {
  const cungMenhIdx = db.cungMenh;
  const cungThanIdx = db.cungThan;
  const cucSo = {1:"Thủy nhị cục",2:"Thủy nhị cục",3:"Mộc tam cục",4:"Kim tứ cục",5:"Thổ ngũ cục",6:"Hỏa lục cục"}[db.cuc.so] || `Cục ${db.cuc.so}`;
  
  const cung_data = [];
  for (let i = 1; i <= 12; i++) {
    const c = db.thapNhiCung[i];
    const tenZ = ZODIAC[i];
    const tenCung = cungMenhIdx > 0 ? CUNG_NAMES[(cungMenhIdx - 1 - (i - 1) + 12) % 12] : CUNG_NAMES[i-1];
    
    const chinh_tinh = [];
    const phu_tinh = [];
    for (const s of (c.cungSao || [])) {
      const info = { ten: s.saoTen, ngu_hanh: s.saoNguHanh || '', am_duong: s.saoAmDuong || '', loai: String(s.saoLoai || '') };
      if (SAO_CHINH_SET.has(s.saoTen)) chinh_tinh.push(info);
      else phu_tinh.push(info);
    }
    
    cung_data.push({
      ten: tenCung, zodiac: tenZ,
      chinh_tinh: chinh_tinh.sort((a,b) => a.ten.localeCompare(b.ten)),
      phu_tinh: phu_tinh.sort((a,b) => a.ten.localeCompare(b.ten)),
      dai_han: c.cungDaiHan || 0,
      la_menh: i === cungMenhIdx,
      la_than: i === cungThanIdx,
    });
  }
  
  return {
    thong_tin: {
      nam, thang, ngay, gio,
      gioi_tinh: gioi_tinh === 1 || String(gioi_tinh).toLowerCase() === 'nam' ? 'Nam' : 'Nữ',
      can_nam: tb.canNamTen, chi_nam: tb.chiNamTen,
      can_thang: tb.canThangTen, chi_thang: tb.chiThangTen,
      can_ngay: tb.canNgayTen, chi_ngay: tb.chiNgayTen,
      ban_menh: tb.banMenh || '',
      menh_chu: tb.menhChu || '',
      than_chu: tb.thanChu || '',
      cuc_so: cucSo,
      am_duong: tb.amDuongNamSinh || '',
      am_duong_menh: tb.amDuongMenh || '',
      cung_menh: cungMenhIdx > 0 ? CUNG_NAMES[(cungMenhIdx - 1 - (cungMenhIdx - 1) + 12) % 12] : '?',
      cung_than: cungThanIdx > 0 ? CUNG_NAMES[(cungMenhIdx - 1 - (cungThanIdx - 1) + 12) % 12] : '?',
    },
    vong_dac_biet: {},
    cung: cung_data
  };
}

export function buildTuviPrompt(chart) {
  const info = chart.thong_tin;
  const cung = chart.cung;
  
  let cungText = '';
  for (const c of cung) {
    const ct = (c.chinh_tinh || []).map(s => s.ten);
    const pt = (c.phu_tinh || []).map(s => s.ten);
    const flags = [];
    if (c.la_menh) flags.push('⭐MỆNH');
    if (c.la_than) flags.push('🌟THÂN');
    cungText += `- Cung ${c.ten} (${c.zodiac}): Chính tinh=[${ct.join(', ') || 'VÔ CHÍNH DIỆU'}], Phụ tinh=[${pt.slice(0,8).join(', ')}], Đại hạn=${c.dai_han} ${flags.join(' ')}\n`;
  }
  
  return `Bạn là một chuyên gia tử vi đẩu số uyên thâm, hãy luận giải chi tiết lá số sau đây bằng tiếng Việt, giọng văn tự nhiên, ấm áp, có chiều sâu.

## THÔNG TIN LÁ SỐ
- Họ tên: ${chart.name || 'Ẩn danh'}
- Ngày sinh: ${info.ngay}/${info.thang}/${info.nam} (Dương lịch)
- Giờ sinh: ${info.gio}h
- Giới tính: ${info.gioi_tinh}
- Năm: ${info.can_nam} ${info.chi_nam}, Tháng: ${info.can_thang} ${info.chi_thang}, Ngày: ${info.can_ngay} ${info.chi_ngay}
- Bản Mệnh: ${info.ban_menh} | Mệnh Chủ: ${info.menh_chu} | Thân Chủ: ${info.than_chu}
- Cục: ${info.cuc_so} | Âm Dương: ${info.am_duong} (${info.am_duong_menh})
- Cung Mệnh: ${info.cung_menh} | Cung Thân: ${info.cung_than}

## 12 CUNG CHI TIẾT
${cungText}

## YÊU CẦU LUẬN GIẢI
Hãy viết bài luận giải theo cấu trúc sau, MỖI PHẦN ÍT NHẤT 300-500 CHỮ:

### 1. TỔNG QUAN (viết ít nhất 400 chữ)
Phân tích tính cách, vận mệnh tổng thể dựa trên sao thủ Mệnh và Thân cung.

### 2. CÔNG DANH SỰ NGHIỆP (viết ít nhất 350 chữ)
Dựa trên cung Quan Lộc, kết hợp tam phương tứ chính.

### 3. TÀI CHÍNH (viết ít nhất 300 chữ)
Dựa trên cung Tài Bạch, nhận xét cách kiếm tiền và giữ tiền.

### 4. TÌNH DUYÊN (viết ít nhất 350 chữ)
Dựa trên cung Phu Thê và các sao đào hoa.

### 5. SỨC KHỎE (viết ít nhất 250 chữ)
Dựa trên cung Tật Ách.

### 6. LỜI KHUYÊN (viết ít nhất 300 chữ)
Lời khuyên tổng thể về hướng đi cuộc đời.

Lưu ý: 
- Viết bằng tiếng Việt tự nhiên, có hồn, tránh liệt kê khô khan.
- Dùng emoji phù hợp để bài viết sinh động.
- Viết DÀI và CHI TIẾT, không giới hạn độ dài.
- Mỗi phần phải là đoạn văn dài, không dùng gạch đầu dòng.`;
}