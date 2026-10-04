import type { DeckType } from '../types/domain';
export type CardEffect = 'MONEY' | 'START' | 'MOVE' | 'DESTINATION' | 'NEAREST_RAILROAD' | 'NEAREST_UTILITY' | 'COLLECT_EACH' | 'PAY_EACH' | 'REPAIRS' | 'GO_TO_JAIL' | 'JAIL_CARD';
export interface CardDefinition { id: string; deck: DeckType; title: string; description: string; effectType: CardEffect; value?: number; destination?: number; houseFee?: number; hotelFee?: number; }
type Entry = Omit<CardDefinition,'id'|'deck'>;
const deck = (type: DeckType, entries: Entry[]): CardDefinition[] => entries.map((card,i) => ({...card,deck:type,id:'v2-' + type.toLowerCase() + '-' + String(i+1).padStart(2,'0')}));
export const CHANCE_CARDS = deck('CHANCE',[
  {title:'Khởi đầu mới',description:'Đến Bắt đầu, nhận 200 Tr.',effectType:'START'},
  {title:'Chuyến tàu gần nhất',description:'Tiến tới ga gần nhất. Nếu có chủ, trả gấp đôi tiền thuê ga.',effectType:'NEAREST_RAILROAD'},
  {title:'Vé tàu tốc hành',description:'Đến ga gần nhất phía trước. Nếu có chủ, trả gấp đôi tiền thuê ga.',effectType:'NEAREST_RAILROAD'},
  {title:'Kiểm tra dịch vụ',description:'Đến tiện ích gần nhất. Nếu có chủ, đổ mới và trả 10 lần tổng xúc xắc.',effectType:'NEAREST_UTILITY'},
  {title:'Thăm Thủ đô',description:'Đến Hà Nội. Qua Bắt đầu nhận 200 Tr.',effectType:'DESTINATION',destination:39},
  {title:'Hẹn ở cố đô',description:'Đến Huế. Qua Bắt đầu nhận 200 Tr.',effectType:'DESTINATION',destination:24},
  {title:'Về miền cao nguyên',description:'Đến Buôn Ma Thuột. Qua Bắt đầu nhận 200 Tr.',effectType:'DESTINATION',destination:11},
  {title:'Tàu vào Nam',description:'Đến Ga Sài Gòn và xử lý ô đến. Qua Bắt đầu nhận 200 Tr.',effectType:'DESTINATION',destination:5},
  {title:'Lùi một chút',description:'Lùi 3 ô và xử lý ô đến; không nhận tiền khi lùi qua Bắt đầu.',effectType:'MOVE',value:-3},
  {title:'Cổ tức đầu tư',description:'Nhận 50 Tr từ ngân hàng.',effectType:'MONEY',value:50},
  {title:'Khoản vay đáo hạn',description:'Nhận 150 Tr.',effectType:'MONEY',value:150},
  {title:'Sửa chữa tài sản',description:'Trả 25 Tr mỗi nhà và 100 Tr mỗi khách sạn đang sở hữu.',effectType:'REPAIRS',houseFee:25,hotelFee:100},
  {title:'Đóng góp cộng đồng',description:'Trả 50 Tr cho mỗi người chơi còn lại.',effectType:'PAY_EACH',value:50},
  {title:'Phạt vi phạm',description:'Trả 15 Tr.',effectType:'MONEY',value:-15},
  {title:'Giấy ra tù',description:'Giữ thẻ để ra tù miễn phí ở đầu một lượt sau. Không tự sử dụng.',effectType:'JAIL_CARD'},
  {title:'Lệnh tạm giam',description:'Đi thẳng vào Nhà tù. Không nhận tiền Bắt đầu.',effectType:'GO_TO_JAIL'},
]);
export const LIFE_CARDS = deck('LIFE',[
  {title:'Về nhà đón Tết',description:'Đến Bắt đầu, nhận 200 Tr.',effectType:'START'},
  {title:'Ngân hàng điều chỉnh',description:'Nhận 200 Tr.',effectType:'MONEY',value:200},
  {title:'Khám sức khỏe',description:'Trả 50 Tr.',effectType:'MONEY',value:-50},
  {title:'Bán đồ cũ',description:'Nhận 50 Tr.',effectType:'MONEY',value:50},
  {title:'Giấy ra tù',description:'Giữ thẻ để tự chọn ra tù miễn phí ở đầu một lượt sau.',effectType:'JAIL_CARD'},
  {title:'Lệnh tạm giam',description:'Đi thẳng vào Nhà tù. Không nhận tiền Bắt đầu.',effectType:'GO_TO_JAIL'},
  {title:'Quỹ tiết kiệm',description:'Nhận 100 Tr.',effectType:'MONEY',value:100},
  {title:'Hoàn thuế',description:'Nhận 20 Tr.',effectType:'MONEY',value:20},
  {title:'Sinh nhật vui vẻ',description:'Nhận 10 Tr từ mỗi người chơi còn lại.',effectType:'COLLECT_EACH',value:10},
  {title:'Bảo hiểm đáo hạn',description:'Nhận 100 Tr.',effectType:'MONEY',value:100},
  {title:'Viện phí',description:'Trả 100 Tr.',effectType:'MONEY',value:-100},
  {title:'Học phí',description:'Trả 50 Tr.',effectType:'MONEY',value:-50},
  {title:'Freelance cuối tuần',description:'Nhận 25 Tr.',effectType:'MONEY',value:25},
  {title:'Sửa đường khu phố',description:'Trả 40 Tr mỗi nhà và 115 Tr mỗi khách sạn đang sở hữu.',effectType:'REPAIRS',houseFee:40,hotelFee:115},
  {title:'Giải thưởng khu phố',description:'Nhận 10 Tr.',effectType:'MONEY',value:10},
  {title:'Thừa kế gia đình',description:'Nhận 100 Tr.',effectType:'MONEY',value:100},
]);
export const CARDS = [...CHANCE_CARDS,...LIFE_CARDS];
export const JAIL_CARD_IDS = CARDS.filter(card => card.effectType === 'JAIL_CARD').map(card => card.id);
