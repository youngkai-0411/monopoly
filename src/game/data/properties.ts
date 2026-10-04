import design from '../../../docs/classic-vietnam-v2.json';
import type { PropertyDefinition } from '../types/domain';

// Display metadata retained from V1. Prices and rent tables come from the design manifest.
const landmarks: Record<string, { shortName: string; landmark: string }> = {
  "ca-mau": {
    "shortName": "C.Mau",
    "landmark": "Mũi Cà Mau"
  },
  "can-tho": {
    "shortName": "C.Thơ",
    "landmark": "Bến Ninh Kiều"
  },
  "phu-quoc": {
    "shortName": "P.Quốc",
    "landmark": "Biển Phú Quốc"
  },
  "binh-thuan": {
    "shortName": "B.Thuận",
    "landmark": "Mũi Né"
  },
  "vung-tau": {
    "shortName": "V.Tàu",
    "landmark": "Tượng Chúa Kitô"
  },
  "tp-hcm": {
    "shortName": "TP.HCM",
    "landmark": "Landmark 81"
  },
  "buon-ma-thuot": {
    "shortName": "BMT",
    "landmark": "Thác Dray Nur"
  },
  "gia-lai": {
    "shortName": "G.Lai",
    "landmark": "Biển Hồ"
  },
  "da-lat": {
    "shortName": "Đ.Lạt",
    "landmark": "Hồ Xuân Hương"
  },
  "nha-trang": {
    "shortName": "N.Trang",
    "landmark": "Biển Nha Trang"
  },
  "quy-nhon": {
    "shortName": "Q.Nhơn",
    "landmark": "Kỳ Co"
  },
  "quang-ngai": {
    "shortName": "Q.Ngãi",
    "landmark": "Lý Sơn"
  },
  "da-nang": {
    "shortName": "Đ.Nẵng",
    "landmark": "Cầu Rồng"
  },
  "hoi-an": {
    "shortName": "H.An",
    "landmark": "Chùa Cầu"
  },
  "hue": {
    "shortName": "Huế",
    "landmark": "Đại Nội"
  },
  "quang-binh": {
    "shortName": "Q.Bình",
    "landmark": "Phong Nha – Kẻ Bàng"
  },
  "ha-tinh": {
    "shortName": "H.Tĩnh",
    "landmark": "Biển Thiên Cầm"
  },
  "nghe-an": {
    "shortName": "N.An",
    "landmark": "Cửa Lò"
  },
  "thanh-hoa": {
    "shortName": "T.Hóa",
    "landmark": "Thành Nhà Hồ"
  },
  "ninh-binh": {
    "shortName": "N.Bình",
    "landmark": "Tràng An"
  },
  "lao-cai": {
    "shortName": "L.Cai",
    "landmark": "Fansipan / Sa Pa"
  },
  "hai-phong": {
    "shortName": "H.Phòng",
    "landmark": "Nhà hát lớn Hải Phòng"
  },
  "ha-noi": {
    "shortName": "H.Nội",
    "landmark": "Hồ Gươm"
  }
};
export const PROPERTIES: PropertyDefinition[] = design.assets.map(asset => {
  const common = { id: asset.id, name: asset.name, price: asset.price,
    shortName: landmarks[asset.id]?.shortName ?? asset.name,
    landmark: landmarks[asset.id]?.landmark ?? (asset.kind === 'RAILROAD' ? 'Kết nối hành trình Việt Nam' : 'Dịch vụ thiết yếu'),
    baseRent: asset.rentByLevel?.[0] ?? 0, upgradeCost: asset.houseCost ?? 0 };
  if (asset.kind === 'LAND') return { ...common, kind: 'LAND', groupId: asset.groupId!, rentByLevel: asset.rentByLevel! };
  if (asset.kind === 'RAILROAD') return { ...common, kind: 'RAILROAD', rentByOwnedCount: asset.rentByOwnedCount! };
  if (asset.kind === 'UTILITY') return { ...common, kind: 'UTILITY', rentMultiplierByOwnedCount: asset.rentMultiplierByOwnedCount! };
  throw new Error('Unknown asset kind');
});
export const ASSET_BY_ID = new Map(PROPERTIES.map(asset => [asset.id, asset]));
