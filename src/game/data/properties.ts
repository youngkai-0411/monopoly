import type { PropertyDefinition } from '../types/domain';

const p = (id: string, name: string, shortName: string, landmark: string, groupId: string, price: number, baseRent: number, upgradeCost: number): PropertyDefinition =>
  ({ id, name, shortName, landmark, groupId, price, baseRent, upgradeCost });

// Economy values are V1 balance placeholders and intentionally data-driven.
export const PROPERTIES: PropertyDefinition[] = [
  p('ca-mau','Cà Mau','C.Mau','Mũi Cà Mau','mien-tay',160,20,100),
  p('can-tho','Cần Thơ','C.Thơ','Bến Ninh Kiều','mien-tay',180,22,100),
  p('phu-quoc','Phú Quốc','P.Quốc','Biển Phú Quốc','mien-tay',220,26,120),
  p('binh-thuan','Bình Thuận','B.Thuận','Mũi Né','phuong-nam',220,26,120),
  p('vung-tau','Vũng Tàu','V.Tàu','Tượng Chúa Kitô','phuong-nam',240,28,120),
  p('tp-hcm','Hồ Chí Minh','TP.HCM','Landmark 81','phuong-nam',320,40,160),
  p('buon-ma-thuot','Buôn Ma Thuột','BMT','Thác Dray Nur','cao-nguyen',200,24,110),
  p('gia-lai','Gia Lai','G.Lai','Biển Hồ','cao-nguyen',210,25,110),
  p('da-lat','Đà Lạt','Đ.Lạt','Hồ Xuân Hương','cao-nguyen',250,30,130),
  p('nha-trang','Nha Trang','N.Trang','Biển Nha Trang','duyen-hai',260,32,140),
  p('quy-nhon','Quy Nhơn','Q.Nhơn','Kỳ Co','duyen-hai',280,35,140),
  p('quang-ngai','Quảng Ngãi','Q.Ngãi','Lý Sơn','duyen-hai',300,38,150),
  p('da-nang','Đà Nẵng','Đ.Nẵng','Cầu Rồng','di-san',300,38,150),
  p('hoi-an','Hội An','H.An','Chùa Cầu','di-san',280,35,140),
  p('hue','Huế','Huế','Đại Nội','di-san',290,36,145),
  p('quang-binh','Quảng Bình','Q.Bình','Phong Nha – Kẻ Bàng','mien-trung-bac',260,32,135),
  p('ha-tinh','Hà Tĩnh','H.Tĩnh','Biển Thiên Cầm','mien-trung-bac',240,29,125),
  p('nghe-an','Nghệ An','N.An','Cửa Lò','mien-trung-bac',270,33,135),
  p('thanh-hoa','Thanh Hóa','T.Hóa','Thành Nhà Hồ','mien-bac',260,32,135),
  p('ninh-binh','Ninh Bình','N.Bình','Tràng An','mien-bac',290,36,145),
  p('lao-cai','Lào Cai','L.Cai','Fansipan / Sa Pa','mien-bac',300,38,150),
  p('hai-phong','Hải Phòng','H.Phòng','Nhà hát lớn Hải Phòng','do-thi',320,40,160),
  p('ha-noi','Hà Nội','H.Nội','Hồ Gươm','do-thi',360,45,180),
];
