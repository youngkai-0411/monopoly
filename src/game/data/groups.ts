import type { GroupDefinition } from '../types/domain';
import { GAME_RULES } from '../rules/config';

const g = (id: string, name: string, propertyIds: string[]): GroupDefinition => ({
  id, name, propertyIds,
  fullGroupRentMultiplier: propertyIds.length === 2 ? GAME_RULES.groupRentMultipliers.twoProperties : GAME_RULES.groupRentMultipliers.threeProperties,
});

export const GROUPS: GroupDefinition[] = [
  g('mien-tay','Miền Tây',['ca-mau','can-tho','phu-quoc']),
  g('phuong-nam','Phương Nam',['binh-thuan','vung-tau','tp-hcm']),
  g('cao-nguyen','Cao Nguyên',['buon-ma-thuot','gia-lai','da-lat']),
  g('duyen-hai','Duyên Hải',['nha-trang','quy-nhon','quang-ngai']),
  g('di-san','Di Sản',['da-nang','hoi-an','hue']),
  g('mien-trung-bac','Miền Trung Bắc',['quang-binh','ha-tinh','nghe-an']),
  g('mien-bac','Miền Bắc',['thanh-hoa','ninh-binh','lao-cai']),
  g('do-thi','Đô Thị',['hai-phong','ha-noi']),
];
