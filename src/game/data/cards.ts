import type { DeckType, StatusEffect } from '../types/domain';

export type CardEffect = 'MONEY' | 'PER_PROPERTY' | 'START' | 'MOVE' | 'NEAREST_UNOWNED' | 'NEAREST_PROPERTY' | 'COLLECT_EACH' | 'PAY_EACH' | 'INSURANCE' | 'REST' | 'STATUS' | 'NONE';
export interface CardDefinition { id: string; deck: DeckType; title: string; description: string; effectType: CardEffect; value?: number; cap?: number; status?: StatusEffect; }
type CardInput = Omit<CardDefinition, 'id' | 'deck'>;
const deck = (type: DeckType, entries: CardInput[]): CardDefinition[] => entries.map((card, index) => ({ ...card, deck: type, id: `${type.toLowerCase()}-${String(index + 1).padStart(2,'0')}` }));

export const CHANCE_CARDS = deck('CHANCE', [
  { title:'Đầu Tư Thành Công', description:'Nhận 200 Tr.', effectType:'MONEY', value:200 },
  { title:'Thị Trường Khởi Sắc', description:'Nhận 100 Tr.', effectType:'MONEY', value:100 },
  { title:'Hợp Đồng Lớn', description:'Nhận 150 Tr.', effectType:'MONEY', value:150 },
  { title:'Cổ Tức Đầu Tư', description:'Nhận 30 Tr mỗi tài sản, tối đa 200 Tr.', effectType:'PER_PROPERTY', value:30, cap:200 },
  { title:'Đầu Tư Thất Bại', description:'Trả 100 Tr.', effectType:'MONEY', value:-100 },
  { title:'Chi Phí Phát Sinh', description:'Trả 150 Tr.', effectType:'MONEY', value:-150 },
  { title:'Bảo Trì Tài Sản', description:'Trả 20 Tr mỗi tài sản, tối đa 200 Tr.', effectType:'PER_PROPERTY', value:-20, cap:200 },
  { title:'Khởi Đầu Mới', description:'Đến Xuất Phát và nhận 200 Tr.', effectType:'START' },
  { title:'Chuyến Đi Xuyên Việt', description:'Tiến 6 ô và xử lý ô đến.', effectType:'MOVE', value:6 },
  { title:'Cơ Hội Đầu Tư', description:'Đến tài sản chưa có chủ gần nhất phía trước.', effectType:'NEAREST_UNOWNED' },
  { title:'Chuyến Công Tác', description:'Đến tài sản gần nhất phía trước.', effectType:'NEAREST_PROPERTY' },
  { title:'Kế Hoạch Thay Đổi', description:'Lùi 3 ô. Không nhận tiền khi lùi qua Xuất Phát.', effectType:'MOVE', value:-3 },
  { title:'Đối Tác Chiến Lược', description:'Nhận 50 Tr từ mỗi người chơi còn lại.', effectType:'COLLECT_EACH', value:50 },
  { title:'Chia Sẻ Lợi Nhuận', description:'Trả 25 Tr cho mỗi người chơi còn lại.', effectType:'PAY_EACH', value:25 },
  { title:'Bảo Hiểm Đầu Tư', description:'Giữ tối đa một thẻ để tự chọn miễn một lần thuê. Nếu đã có, nhận 100 Tr.', effectType:'INSURANCE' },
  { title:'Thương Vụ May Mắn', description:'Nhận 150 Tr.', effectType:'MONEY', value:150 },
]);

export const LIFE_CARDS = deck('LIFE', [
  { title:'Lì Xì Đầu Năm', description:'Nhận 100 Tr.', effectType:'MONEY', value:100 },
  { title:'Thưởng Tết', description:'Nhận 200 Tr.', effectType:'MONEY', value:200 },
  { title:'Freelance Cuối Tuần', description:'Nhận 100 Tr.', effectType:'MONEY', value:100 },
  { title:'Sinh Nhật Bất Ngờ', description:'Nhận 50 Tr.', effectType:'MONEY', value:50 },
  { title:'Đám Cưới Đồng Nghiệp', description:'Trả 50 Tr.', effectType:'MONEY', value:-50 },
  { title:'“Để Tôi Bao!”', description:'Trả 50 Tr.', effectType:'MONEY', value:-50 },
  { title:'Săn Sale Quá Tay', description:'Trả 100 Tr.', effectType:'MONEY', value:-100 },
  { title:'Xe Hư Giữa Đường', description:'Trả 100 Tr.', effectType:'MONEY', value:-100 },
  { title:'Khám Sức Khỏe', description:'Trả 50 Tr.', effectType:'MONEY', value:-50 },
  { title:'Khao Cả Hội', description:'Trả 25 Tr cho mỗi người chơi còn lại.', effectType:'PAY_EACH', value:25 },
  { title:'Mừng Tuổi Mọi Người', description:'Trả 25 Tr cho mỗi người chơi còn lại.', effectType:'PAY_EACH', value:25 },
  { title:'Kỳ Nghỉ Bất Ngờ', description:'Tiến đến Nghỉ Ngơi và xử lý ô đến.', effectType:'REST' },
  { title:'Mưa Lớn', description:'Lùi 3 ô và xử lý ô đến.', effectType:'MOVE', value:-3 },
  { title:'Kẹt Xe', description:'Lượt sau dùng một xúc xắc. Triệt tiêu Cà Phê Sáng.', effectType:'STATUS', status:'TRAFFIC' },
  { title:'Cà Phê Sáng', description:'Lượt sau cộng 2 vào tổng xúc xắc. Triệt tiêu Kẹt Xe.', effectType:'STATUS', status:'COFFEE' },
  { title:'Ngày Đẹp Trời', description:'Không có hiệu ứng. Chúc bạn một ngày vui!', effectType:'NONE' },
]);
export const CARDS = [...CHANCE_CARDS, ...LIFE_CARDS];
export const INSURANCE_CARD_ID = 'chance-15';
