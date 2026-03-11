import React, { useState } from 'react';
import { BookOpen, FileText, CheckCircle, Eye, Plus, X } from 'lucide-react';

const sampleAssignments = [
  {
    id: 'lib-1',
    title: 'Viết đoạn văn tả cảnh biển',
    type: 'essay',
    description: 'Em hãy viết một đoạn văn ngắn (khoảng 5-7 câu) tả cảnh biển vào buổi sáng sớm.',
    sampleAnswer: 'Buổi sáng sớm, cảnh biển thật tuyệt đẹp. Mặt trời từ từ nhô lên khỏi mặt biển, tỏa những tia nắng ấm áp đầu tiên. Bầu trời trong xanh, lác đác vài đám mây trắng trôi lững lờ. Từng đợt sóng vỗ rì rào vào bờ cát trắng mịn. Xa xa, những chiếc thuyền đánh cá đang tấp nập trở về sau một đêm lao động vất vả. Không khí trong lành, mát mẻ mang theo vị mặn mòi của biển cả. Em rất yêu cảnh biển quê hương em.',
  },
  {
    id: 'lib-2',
    title: 'Toán lớp 3: Phép nhân và phép chia',
    type: 'quiz',
    description: 'Ôn tập phép nhân và phép chia trong phạm vi 100.',
    questions: [
      { q: '5 x 7 = ?', options: ['30', '35', '40', '45'], answer: '35' },
      { q: '42 : 6 = ?', options: ['6', '7', '8', '9'], answer: '7' },
      { q: 'Mỗi hộp có 8 cái kẹo. Hỏi 4 hộp có bao nhiêu cái kẹo?', options: ['24', '32', '40', '48'], answer: '32' },
      { q: 'Có 36 học sinh xếp đều thành 4 hàng. Hỏi mỗi hàng có bao nhiêu học sinh?', options: ['7', '8', '9', '10'], answer: '9' }
    ]
  },
  {
    id: 'lib-3',
    title: 'Tự nhiên và Xã hội: Các bộ phận của cây',
    type: 'quiz',
    description: 'Kiểm tra kiến thức về các bộ phận của cây xanh.',
    questions: [
      { q: 'Bộ phận nào của cây thường nằm dưới mặt đất?', options: ['Rễ', 'Thân', 'Lá', 'Hoa'], answer: 'Rễ' },
      { q: 'Lá cây thường có màu gì?', options: ['Đỏ', 'Vàng', 'Xanh lục', 'Tím'], answer: 'Xanh lục' },
      { q: 'Bộ phận nào giúp cây bám chặt vào đất và hút nước?', options: ['Thân', 'Lá', 'Hoa', 'Rễ'], answer: 'Rễ' }
    ]
  },
  {
    id: 'lib-4',
    title: 'Viết thư cho người thân',
    type: 'essay',
    description: 'Em hãy viết một bức thư ngắn hỏi thăm sức khỏe ông bà ở quê.',
    sampleAnswer: 'Hà Nội, ngày 15 tháng 10 năm 2023\n\nÔng bà kính yêu của cháu!\n\nDạo này ông bà có khỏe không ạ? Bệnh đau lưng của ông đã đỡ chưa? Cháu và bố mẹ trên này vẫn khỏe. Năm nay cháu học lớp 3 rồi, cháu hứa sẽ chăm ngoan học giỏi để cuối năm được phần thưởng mang về khoe ông bà. Cháu nhớ ông bà nhiều lắm. Cháu mong đến Tết để được về quê thăm ông bà.\n\nCháu ngoan của ông bà,\nLan'
  },
  {
    id: 'lib-5',
    title: 'Tiếng Việt: Luyện từ và câu',
    type: 'quiz',
    description: 'Ôn tập về từ chỉ sự vật, hoạt động, đặc điểm.',
    questions: [
      { q: 'Từ nào dưới đây là từ chỉ sự vật?', options: ['Chạy', 'Xanh biếc', 'Bàn ghế', 'Vui vẻ'], answer: 'Bàn ghế' },
      { q: 'Từ nào dưới đây là từ chỉ hoạt động?', options: ['Hát', 'Đẹp', 'Sách vở', 'Cao'], answer: 'Hát' },
      { q: 'Từ nào dưới đây là từ chỉ đặc điểm?', options: ['Nhanh nhẹn', 'Đi', 'Học sinh', 'Ngủ'], answer: 'Nhanh nhẹn' }
    ]
  }
];

export default function Library({ onUseAssignment }: { onUseAssignment: (assignment: any) => void }) {
  const [selectedItem, setSelectedItem] = useState<any>(null);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
          <BookOpen className="w-6 h-6 text-indigo-500" /> Thư viện bài tập
        </h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {sampleAssignments.map(item => (
          <div key={item.id} className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 hover:border-indigo-300 transition-colors flex flex-col">
            <div className="flex justify-between items-start mb-3">
              <span className={`inline-block px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-wider ${item.type === 'essay' ? 'bg-amber-100 text-amber-700' : 'bg-sky-100 text-sky-700'}`}>
                {item.type === 'essay' ? 'Tự luận' : 'Trắc nghiệm'}
              </span>
            </div>
            <h3 className="font-bold text-lg text-slate-800 mb-2">{item.title}</h3>
            <p className="text-sm text-slate-600 mb-4 line-clamp-2 flex-grow">{item.description}</p>
            
            <div className="flex gap-3 mt-4 pt-4 border-t border-slate-100">
              <button 
                onClick={() => setSelectedItem(item)}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-medium transition-colors"
              >
                <Eye className="w-4 h-4" /> Xem
              </button>
              <button 
                onClick={() => onUseAssignment(item)}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl font-medium transition-colors"
              >
                <Plus className="w-4 h-4" /> Dùng
              </button>
            </div>
          </div>
        ))}
      </div>

      {selectedItem && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-[2rem] w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="sticky top-0 bg-white/80 backdrop-blur-md px-6 py-4 border-b border-slate-100 flex justify-between items-center z-10">
              <h3 className="text-xl font-bold text-slate-800">Chi tiết bài tập</h3>
              <button onClick={() => setSelectedItem(null)} className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-full transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="p-6 space-y-6">
              <div>
                <span className={`inline-block px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-wider mb-3 ${selectedItem.type === 'essay' ? 'bg-amber-100 text-amber-700' : 'bg-sky-100 text-sky-700'}`}>
                  {selectedItem.type === 'essay' ? 'Tự luận' : 'Trắc nghiệm'}
                </span>
                <h2 className="text-2xl font-bold text-slate-800 mb-2">{selectedItem.title}</h2>
                <p className="text-slate-600">{selectedItem.description}</p>
              </div>

              {selectedItem.type === 'essay' && (
                <div className="bg-amber-50 p-5 rounded-2xl border border-amber-100">
                  <h4 className="font-bold text-amber-800 mb-2 flex items-center gap-2">
                    <FileText className="w-5 h-5" /> Bài làm mẫu / Đáp án gợi ý:
                  </h4>
                  <p className="text-amber-900 whitespace-pre-wrap">{selectedItem.sampleAnswer}</p>
                </div>
              )}

              {selectedItem.type === 'quiz' && (
                <div className="space-y-4">
                  <h4 className="font-bold text-slate-800 flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-sky-500" /> Danh sách câu hỏi:
                  </h4>
                  {selectedItem.questions.map((q: any, i: number) => (
                    <div key={i} className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                      <p className="font-bold text-slate-800 mb-3">{i + 1}. {q.q}</p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {q.options.map((opt: string, optIdx: number) => (
                          <div key={optIdx} className={`px-3 py-2 rounded-lg border ${opt === q.answer ? 'bg-emerald-50 border-emerald-200 text-emerald-700 font-medium' : 'bg-white border-slate-200 text-slate-600'}`}>
                            {opt} {opt === q.answer && <CheckCircle className="w-4 h-4 inline-block ml-1" />}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            <div className="sticky bottom-0 bg-white border-t border-slate-100 p-4 flex justify-end gap-3">
              <button onClick={() => setSelectedItem(null)} className="px-6 py-2 text-slate-600 font-medium hover:bg-slate-100 rounded-xl transition-colors">
                Đóng
              </button>
              <button 
                onClick={() => {
                  onUseAssignment(selectedItem);
                  setSelectedItem(null);
                }}
                className="px-6 py-2 bg-indigo-500 hover:bg-indigo-600 text-white font-medium rounded-xl transition-colors flex items-center gap-2"
              >
                <Plus className="w-5 h-5" /> Sử dụng bài này
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
