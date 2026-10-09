import React, { useState, useMemo } from 'react';
import { BookOpen, FileText, CheckCircle2, Eye, Plus, X, Search, Sparkles, Filter, Check, Award, HelpCircle, Layers } from 'lucide-react';

export interface ExerciseItem {
  id: string;
  title: string;
  subject: 'math' | 'vietnamese' | 'science' | 'english' | 'ethics';
  subjectName: string;
  type: 'essay' | 'quiz';
  level: 'Cơ bản' | 'Vận dụng' | 'Nâng cao';
  grade: string;
  description: string;
  sampleAnswer?: string;
  gradingCriteria?: string[];
  questions?: Array<{
    q: string;
    options: string[];
    answer: string;
    explanation?: string;
  }>;
}

export const sampleLibraryExercises: ExerciseItem[] = [
  // --- TOÁN HỌC (MATH) ---
  {
    id: 'lib-toan-1',
    title: 'Toán 3: Bảng nhân 7, 8, 9 và bài toán giảm đi một số lần',
    subject: 'math',
    subjectName: 'Toán học',
    type: 'quiz',
    level: 'Cơ bản',
    grade: 'Lớp 3',
    description: 'Kiểm tra bảng nhân 7, 8, 9 và nhận biết bài toán giảm đi một số lần trong phạm vi 100.',
    questions: [
      {
        q: 'Kết quả của phép tính 7 x 8 là bao nhiêu?',
        options: ['54', '56', '63', '64'],
        answer: '56',
        explanation: 'Theo bảng nhân 7: 7 x 8 = 56.'
      },
      {
        q: 'Một sợi dây dài 32cm, sau khi cắt ngắn đi 4 lần thì sợi dây còn lại dài bao nhiêu xăng-ti-mét?',
        options: ['28cm', '8cm', '6cm', '128cm'],
        answer: '8cm',
        explanation: 'Giảm đi 4 lần nghĩa là lấy độ dài ban đầu chia cho 4: 32 : 4 = 8 (cm).'
      },
      {
        q: 'Tìm x biết: x : 9 = 8 (dư 5)',
        options: ['72', '77', '67', '83'],
        answer: '77',
        explanation: 'Muốn tìm số bị chia trong phép chia có dư: x = (thương x số chia) + số dư = (8 x 9) + 5 = 72 + 5 = 77.'
      },
      {
        q: 'Mẹ có 45 quả cam. Mẹ chia đều vào 5 giỏ. Hỏi mỗi giỏ có bao nhiêu quả cam?',
        options: ['8 quả', '9 quả', '7 quả', '10 quả'],
        answer: '9 quả',
        explanation: 'Số cam mỗi giỏ là: 45 : 5 = 9 (quả).'
      }
    ]
  },
  {
    id: 'lib-toan-2',
    title: 'Toán 3: Tính chu vi và diện tích hình chữ nhật, hình vuông',
    subject: 'math',
    subjectName: 'Toán học',
    type: 'quiz',
    level: 'Vận dụng',
    grade: 'Lớp 3',
    description: 'Bài tập rèn luyện kỹ năng tính chu vi và diện tích hình chữ nhật, hình vuông có lời văn.',
    questions: [
      {
        q: 'Một mảnh vườn hình chữ nhật có chiều dài 12m, chiều rộng 6m. Chu vi của mảnh vườn là:',
        options: ['36m', '72m', '18m', '48m'],
        answer: '36m',
        explanation: 'Chu vi hình chữ nhật = (chiều dài + chiều rộng) x 2 = (12 + 6) x 2 = 18 x 2 = 36 (m).'
      },
      {
        q: 'Diện tích của mảnh vườn hình chữ nhật ở câu trên là bao nhiêu mét vuông?',
        options: ['36 m²', '72 m²', '64 m²', '18 m²'],
        answer: '72 m²',
        explanation: 'Diện tích hình chữ nhật = chiều dài x chiều rộng = 12 x 6 = 72 (m²).'
      },
      {
        q: 'Một cái sân hình vuông có cạnh dài 8m. Chu vi của sân hình vuông đó là:',
        options: ['16m', '24m', '32m', '64m'],
        answer: '32m',
        explanation: 'Chu vi hình vuông = cạnh x 4 = 8 x 4 = 32 (m).'
      },
      {
        q: 'Một tấm bìa hình vuông có chu vi là 28cm. Hỏi diện tích tấm bìa đó là bao nhiêu?',
        options: ['49 cm²', '28 cm²', '36 cm²', '56 cm²'],
        answer: '49 cm²',
        explanation: 'Độ dài cạnh hình vuông là: 28 : 4 = 7 (cm). Diện tích hình vuông là: 7 x 7 = 49 (cm²).'
      }
    ]
  },
  {
    id: 'lib-toan-3',
    title: 'Toán 3 (Tự luận): Giải bài toán bằng hai phép tính',
    subject: 'math',
    subjectName: 'Toán học',
    type: 'essay',
    level: 'Vận dụng',
    grade: 'Lớp 3',
    description: 'Đề bài: Hàng thứ nhất có 15 cây bưởi. Hàng thứ hai có số cây bưởi gấp 3 lần hàng thứ nhất. Hỏi cả hai hàng có tất cả bao nhiêu cây bưởi?',
    sampleAnswer: `Bài giải:
Số cây bưởi ở hàng thứ hai là:
    15 x 3 = 45 (cây)
Cả hai hàng có tất cả số cây bưởi là:
    15 + 45 = 60 (cây)
        Đáp số: 60 cây bưởi.`,
    gradingCriteria: [
      'Lời giải phép tính thứ nhất đúng và rõ ràng (2.5 điểm)',
      'Phép tính thứ nhất đúng: 15 x 3 = 45 (cây) (2.5 điểm)',
      'Lời giải phép tính thứ hai đúng (2.5 điểm)',
      'Phép tính thứ hai và đáp số đúng: 15 + 45 = 60 (cây) (2.5 điểm)'
    ]
  },

  // --- TIẾNG VIỆT (VIETNAMESE) ---
  {
    id: 'lib-tv-1',
    title: 'Tập làm văn 3: Viết đoạn văn tả một đồ dùng học tập em yêu thích',
    subject: 'vietnamese',
    subjectName: 'Tiếng Việt',
    type: 'essay',
    level: 'Cơ bản',
    grade: 'Lớp 3',
    description: 'Em hãy viết một đoạn văn ngắn từ 5 đến 7 câu tả một đồ dùng học tập gắn bó với em hàng ngày (hộp bút, bút mực, cặp sách hoặc thước kẻ).',
    sampleAnswer: `Vào đầu năm học lớp 3, mẹ mua tặng em một chiếc hộp bút màu xanh da trời rất đẹp. Chiếc hộp có hình chữ nhật nhỏ nhắn, trên nắp in hình chú mèo máy Doraemon đáng yêu. Hộp bút được làm bằng nhựa bóng cứng cáp và có khóa bấm tiện lợi. Bên trong hộp chia làm hai ngăn, ngăn trên em để bút mực và bút chì, ngăn dưới em cất thước kẻ cùng cục tẩy trắng tinh. Chiếc hộp bút luôn giữ cho các đồ dùng của em gọn gàng, ngăn nắp. Em rất yêu quý chiếc hộp bút này và luôn giữ gìn cẩn thận để dùng được lâu bền.`,
    gradingCriteria: [
      'Mở đoạn: Giới thiệu được đồ dùng học tập và thời điểm có nó (2.0 điểm)',
      'Thân đoạn: Tả được hình dáng, màu sắc, chất liệu và công dụng của đồ dùng (5.0 điểm)',
      'Kết đoạn: Nêu được tình cảm và cách giữ gìn của bản thân (2.0 điểm)',
      'Chính tả, dùng từ đặt câu lưu loát, giàu cảm xúc (1.0 điểm)'
    ]
  },
  {
    id: 'lib-tv-2',
    title: 'Luyện từ và câu 3: Phép so sánh và nhân hóa',
    subject: 'vietnamese',
    subjectName: 'Tiếng Việt',
    type: 'quiz',
    level: 'Vận dụng',
    grade: 'Lớp 3',
    description: 'Ôn tập nhận biết các hình ảnh so sánh, từ ngữ so sánh và biện pháp nhân hóa trong câu văn, câu thơ.',
    questions: [
      {
        q: 'Câu nào dưới đây có sử dụng hình ảnh so sánh?',
        options: [
          'Mặt trời như một quả cầu lửa khổng lồ từ từ nhô lên.',
          'Em rất thích ngắm hoàng hôn trên cánh đồng lúa.',
          'Các bạn học sinh đang chăm chỉ học bài trong lớp.',
          'Gió thổi mát rượi qua từng tán lá xanh.'
        ],
        answer: 'Mặt trời như một quả cầu lửa khổng lồ từ từ nhô lên.',
        explanation: 'Câu này so sánh "Mặt trời" với "quả cầu lửa khổng lồ" qua từ so sánh "như".'
      },
      {
        q: 'Trong câu thơ: "Bác kim giờ thận trọng / Nhích từng ly, từng ly", sự vật nào được nhân hóa?',
        options: ['Kim giờ', 'Kim phút', 'Kim giây', 'Đồng hồ'],
        answer: 'Kim giờ',
        explanation: '"Kim giờ" được gọi bằng "Bác" và có hành động "thận trọng, nhích từng ly" như con người.'
      },
      {
        q: 'Từ so sánh thích hợp điền vào chỗ chấm: "Mắt em bé tròn xoe ... hạt nhãn." là:',
        options: ['như', 'và', 'vì', 'nhưng'],
        answer: 'như',
        explanation: 'Từ "như" dùng để liên kết sự vật 1 (mắt em bé) với sự vật 2 (hạt nhãn).'
      },
      {
        q: 'Biện pháp nhân hóa là gì?',
        options: [
          'Gọi hoặc tả con vật, đồ vật, cây cối bằng những từ ngữ vốn dùng cho người.',
          'Đối chiếu hai sự vật có nét tương đồng với nhau.',
          'Lặp lại một từ nhiều lần trong câu văn.',
          'Dùng từ ngữ trái nghĩa nhau để tạo ấn tượng mạnh.'
        ],
        answer: 'Gọi hoặc tả con vật, đồ vật, cây cối bằng những từ ngữ vốn dùng cho người.',
        explanation: 'Khái niệm nhân hóa là làm cho vật vô tri hay con vật có tính cách, hành động của con người.'
      }
    ]
  },
  {
    id: 'lib-tv-3',
    title: 'Tập làm văn 3: Viết thư cho người thân hỏi thăm sức khỏe',
    subject: 'vietnamese',
    subjectName: 'Tiếng Việt',
    type: 'essay',
    level: 'Nâng cao',
    grade: 'Lớp 3',
    description: 'Em hãy viết một bức thư ngắn (từ 7-9 câu) gửi cho ông bà hoặc người thân ở xa để thăm hỏi sức khỏe và kể tình hình học tập của em.',
    sampleAnswer: `Hà Nội, ngày 10 tháng 10 năm 2024

Ông bà kính yêu của cháu!
Dạo này thời tiết đã chuyển sang thu se lạnh, sức khỏe của ông bà có tốt không ạ? Bệnh đau khớp của bà đã đỡ nhiều chưa? 
Cháu và cả nhà trên này vẫn luôn mạnh khỏe. Năm nay cháu lên lớp 3 rồi, bài học tuy có khó hơn nhưng cháu vẫn luôn cố gắng chăm chỉ. Ở đợt kiểm tra vừa rồi, cháu đạt điểm Mười môn Toán đấy ông bà ạ! Cô giáo còn khen cháu viết chữ ngày càng tiến bộ.
Cháu nhớ vườn cây và những món bánh bà làm cho cháu lắm. Cháu hứa sẽ học thật giỏi để Tết này được bố mẹ cho về quê thăm ông bà. 
Cháu chúc ông bà luôn dồi dào sức khỏe và sống lâu trăm tuổi!

Cháu ngoan của ông bà,
Nguyễn Hoàng Nam`,
    gradingCriteria: [
      'Địa điểm, thời gian và lời xưng hô đầu thư đúng thể thức (2.0 điểm)',
      'Phần nội dung: Thăm hỏi sức khỏe và kể về việc học tập của bản thân (5.0 điểm)',
      'Lời chúc, lời hứa hẹn và chữ ký cuối thư (2.0 điểm)',
      'Trình bày sạch đẹp, tình cảm chân thành (1.0 điểm)'
    ]
  },

  // --- TỰ NHIÊN & XÃ HỘI (SCIENCE) ---
  {
    id: 'lib-tnxh-1',
    title: 'Tự nhiên & Xã hội 3: Cơ quan tuần hoàn và cơ quan thần kinh',
    subject: 'science',
    subjectName: 'Tự nhiên & Xã hội',
    type: 'quiz',
    level: 'Cơ bản',
    grade: 'Lớp 3',
    description: 'Tìm hiểu chức năng của tim, mạch máu, não bộ và các biện pháp bảo vệ sức khỏe.',
    questions: [
      {
        q: 'Cơ quan tuần hoàn trong cơ thể người gồm có các bộ phận nào?',
        options: ['Tim và các mạch máu', 'Phổi và khí quản', 'Dạ dày và ruột', 'Não và tủy sống'],
        answer: 'Tim và các mạch máu',
        explanation: 'Cơ quan tuần hoàn gồm có tim và hệ thống các mạch máu (động mạch, tĩnh mạch, mao mạch).'
      },
      {
        q: 'Bộ phận nào đóng vai trò như một chiếc máy bơm, liên tục co bóp để đẩy máu đi khắp cơ thể?',
        options: ['Trái tim', 'Phổi', 'Gan', 'Thận'],
        answer: 'Trái tim',
        explanation: 'Tim co bóp nhịp nhàng không ngừng nghỉ để bơm máu mang oxy và dinh dưỡng nuôi cơ thể.'
      },
      {
        q: 'Để bảo vệ cơ quan thần kinh, học sinh KHÔNG nên làm điều nào sau đây?',
        options: [
          'Thức khuya chơi điện tử hoặc xem tivi quá nhiều',
          'Ngủ đủ từ 8 đến 9 tiếng mỗi ngày',
          'Ăn uống đủ chất và đúng giờ',
          'Tập thể dục thể thao đều đặn ngoài trời'
        ],
        answer: 'Thức khuya chơi điện tử hoặc xem tivi quá nhiều',
        explanation: 'Thức khuya và nhìn màn hình quá nhiều làm căng thẳng hệ thần kinh, mỏi mắt và suy giảm trí nhớ.'
      },
      {
        q: 'Bộ phận nào là trung ương điều khiển mọi suy nghĩ, cảm xúc và hành động của cơ thể?',
        options: ['Não bộ', 'Bao tử', 'Cánh tay', 'Xương sườn'],
        answer: 'Não bộ',
        explanation: 'Bộ não nằm trong hộp sọ, là trung tâm chỉ huy tiếp nhận và xử lý mọi thông tin của cơ thể.'
      }
    ]
  },
  {
    id: 'lib-tnxh-2',
    title: 'Tự nhiên & Xã hội 3 (Tự luận): Giữ gìn vệ sinh môi trường học đường',
    subject: 'science',
    subjectName: 'Tự nhiên & Xã hội',
    type: 'essay',
    level: 'Vận dụng',
    grade: 'Lớp 3',
    description: 'Em hãy nêu 4 việc làm cụ thể của học sinh để giữ gìn trường lớp luôn xanh, sạch, đẹp và an toàn.',
    sampleAnswer: `Để giữ cho trường lớp luôn xanh, sạch, đẹp và an toàn, chúng em cần thực hiện những việc làm sau:
1. Bỏ rác đúng nơi quy định: Không vứt giấy rác, vỏ kẹo, hộp sữa bừa bãi xuống sân trường hay trong ngăn bàn; phân loại rác tái chế và rác hữu cơ vào đúng thùng rác.
2. Trực nhật lớp sạch sẽ: Thường xuyên quét dọn lớp học, lau bảng sạch, sắp xếp bàn ghế ngay ngắn sau mỗi buổi học.
3. Chăm sóc và bảo vệ cây xanh: Tưới nước cho bồn hoa của lớp, không ngắt hoa bẻ cành hay dẫm đạp lên thảm cỏ sân trường.
4. Giữ gìn nhà vệ sinh chung: Đi vệ sinh đúng cách, xả nước sạch sẽ sau khi đi và rửa tay bằng xà phòng để phòng ngừa dịch bệnh.`,
    gradingCriteria: [
      'Nêu đủ 4 ý rõ ràng, thực tế gắn liền với hoạt động ở trường (8.0 điểm - 2 điểm/ý)',
      'Lời văn mạch lạc, có ý thức tuyên truyền bảo vệ môi trường (2.0 điểm)'
    ]
  },

  // --- TIẾNG ANH (ENGLISH) ---
  {
    id: 'lib-eng-1',
    title: 'Tiếng Anh 3: Family, School Things & Colors',
    subject: 'english',
    subjectName: 'Tiếng Anh',
    type: 'quiz',
    level: 'Cơ bản',
    grade: 'Lớp 3',
    description: 'Practice basic English vocabulary: Family members, classroom objects, and simple questions.',
    questions: [
      {
        q: 'What is this? "It is used for writing and you can erase with a rubber."',
        options: ['A pencil', 'A chair', 'A ruler', 'A school bag'],
        answer: 'A pencil',
        explanation: '"A pencil" (bút chì) được dùng để viết và có thể tẩy được.'
      },
      {
        q: 'How do you say "bà nội / bà ngoại" in English?',
        options: ['Grandmother', 'Mother', 'Sister', 'Aunt'],
        answer: 'Grandmother',
        explanation: 'Grandmother (hoặc Grandma) có nghĩa là bà nội hoặc bà ngoại.'
      },
      {
        q: 'Choose the correct answer: "How old are you?" - "________"',
        options: ['I am eight years old.', 'I am fine, thank you.', 'My name is Nam.', 'I like red.'],
        answer: 'I am eight years old.',
        explanation: 'Câu hỏi "How old are you?" hỏi về tuổi tác, câu trả lời đúng là "I am eight years old."'
      },
      {
        q: 'What color is the sky on a sunny day?',
        options: ['Blue', 'Yellow', 'Black', 'Green'],
        answer: 'Blue',
        explanation: 'Vào ngày nắng, bầu trời trong xanh: "Blue" (màu xanh da trời).'
      }
    ]
  },

  // --- KỸ NĂNG SỐNG & ĐẠO ĐỨC (ETHICS) ---
  {
    id: 'lib-eth-1',
    title: 'Kỹ năng sống 3: An toàn khi tham gia giao thông và tự bảo vệ bản thân',
    subject: 'ethics',
    subjectName: 'Kỹ năng sống & Đạo đức',
    type: 'quiz',
    level: 'Vận dụng',
    grade: 'Lớp 3',
    description: 'Trang bị kiến thức an toàn giao thông đường bộ và quy tắc tự bảo vệ khi gặp người lạ.',
    questions: [
      {
        q: 'Khi ngồi trên xe mô tô, xe gắn máy hoặc xe máy điện cùng bố mẹ, học sinh phải làm gì?',
        options: [
          'Đội mũ bảo hiểm đạt chuẩn và cài quai đúng quy cách',
          'Không cần đội mũ bảo hiểm nếu đi đoạn đường ngắn',
          'Đứng lên yên xe để ngắm đường phố cho rõ',
          'Cầm ô che nắng khi xe đang chạy'
        ],
        answer: 'Đội mũ bảo hiểm đạt chuẩn và cài quai đúng quy cách',
        explanation: 'Đội mũ bảo hiểm cài quai đúng quy cách bảo vệ an toàn tính mạng khi tham gia giao thông.'
      },
      {
        q: 'Khi đi bộ sang đường, em cần chú ý điều gì?',
        options: [
          'Đi trên vạch kẻ đường dành cho người đi bộ và chú ý quan sát xe hai bên',
          'Vừa chạy thật nhanh sang đường vừa đùa giỡn cùng bạn bè',
          'Leo qua dải phân cách giữa đường để qua cho nhanh',
          'Vừa đi vừa nhìn chăm chú vào điện thoại'
        ],
        answer: 'Đi trên vạch kẻ đường dành cho người đi bộ và chú ý quan sát xe hai bên',
        explanation: 'Người đi bộ phải tuân thủ đi trên vạch kẻ đường và tập trung quan sát đảm bảo an toàn.'
      },
      {
        q: 'Khi có một người lạ tặng kẹo và rủ em lên xe đi chơi khi em đang đợi bố mẹ đón ở cổng trường, em nên làm gì?',
        options: [
          'Lịch sự từ chối, lùi lại xa và chạy vào phòng bảo vệ hoặc báo với thầy cô',
          'Nhận kẹo và đi theo ngay vì người lạ trông rất hiền từ',
          'Đi theo người lạ xem họ dẫn đi đâu rồi gọi điện cho mẹ',
          'Lấy kẹo rồi chia cho các bạn cùng lớp ăn thử'
        ],
        answer: 'Lịch sự từ chối, lùi lại xa và chạy vào phòng bảo vệ hoặc báo với thầy cô',
        explanation: 'Quy tắc an toàn: Tuyệt đối không nhận đồ ăn và không đi theo người lạ, báo ngay cho người lớn đáng tin cậy.'
      }
    ]
  }
];

interface LibraryProps {
  onUseAssignment: (item: ExerciseItem) => void;
}

export default function Library({ onUseAssignment }: LibraryProps) {
  const [selectedSubject, setSelectedSubject] = useState<string>('all');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [previewItem, setPreviewItem] = useState<ExerciseItem | null>(null);

  const subjects = [
    { id: 'all', name: 'Tất cả môn', icon: '🎒', color: 'slate' },
    { id: 'math', name: 'Toán học', icon: '📐', color: 'sky' },
    { id: 'vietnamese', name: 'Tiếng Việt', icon: '📖', color: 'amber' },
    { id: 'science', name: 'Tự nhiên & Xã hội', icon: '🌿', color: 'emerald' },
    { id: 'english', name: 'Tiếng Anh', icon: '🇬🇧', color: 'indigo' },
    { id: 'ethics', name: 'Kỹ năng & Đạo đức', icon: '💡', color: 'rose' }
  ];

  const filteredExercises = useMemo(() => {
    return sampleLibraryExercises.filter((item) => {
      const matchSubject = selectedSubject === 'all' || item.subject === selectedSubject;
      const matchType = selectedType === 'all' || item.type === selectedType;
      const matchQuery =
        searchQuery.trim() === '' ||
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.subjectName.toLowerCase().includes(searchQuery.toLowerCase());
      return matchSubject && matchType && matchQuery;
    });
  }, [selectedSubject, selectedType, searchQuery]);

  return (
    <div className="space-y-6">
      {/* Header Banner - Android Modern Style */}
      <div className="bg-gradient-to-r from-sky-500 via-indigo-500 to-purple-600 rounded-3xl p-6 sm:p-8 text-white shadow-xl shadow-sky-500/15 relative overflow-hidden">
        <div className="absolute right-0 top-0 w-80 h-80 bg-white/10 rounded-full blur-2xl pointer-events-none" />
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 backdrop-blur-sm text-xs font-bold uppercase tracking-wider mb-2">
              <Sparkles className="w-3.5 h-3.5" /> Kho học liệu chuẩn lớp 3
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Thư viện bài tập mẫu & Đề thi 📚
            </h2>
            <p className="text-sky-100 text-xs sm:text-sm font-medium mt-1 max-w-2xl">
              Tổng hợp các bài tập tự luận và trắc nghiệm chuẩn chương trình lớp 3, đầy đủ đáp án chi tiết và hướng dẫn chấm để thầy cô tham khảo hoặc giao ngay cho lớp chỉ với 1 click!
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-center shrink-0">
            <div className="bg-white/15 backdrop-blur-md px-4 py-2.5 rounded-2xl border border-white/25 text-center">
              <span className="block text-xl font-extrabold">{sampleLibraryExercises.length}</span>
              <span className="text-[11px] font-bold text-sky-100 uppercase tracking-wider">Bài mẫu có sẵn</span>
            </div>
          </div>
        </div>
      </div>

      {/* Search & Filter Controls */}
      <div className="bg-white p-4 sm:p-5 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
        {/* Search Bar */}
        <div className="relative">
          <Search className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Tìm kiếm theo tên bài, chủ đề, từ khóa (VD: phép nhân, chu vi, đồ dùng học tập...)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-3 rounded-2xl border border-slate-200 focus:border-sky-500 focus:ring-4 focus:ring-sky-500/15 outline-none transition-all text-sm font-medium text-slate-800 placeholder:text-slate-400 bg-slate-50/60"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Subject Filter Pills (Scrollable on Mobile) */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          {subjects.map((sub) => {
            const isActive = selectedSubject === sub.id;
            return (
              <button
                key={sub.id}
                onClick={() => setSelectedSubject(sub.id)}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all cursor-pointer ${
                  isActive
                    ? 'bg-sky-500 text-white shadow-sm shadow-sky-500/25'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-800'
                }`}
              >
                <span>{sub.icon}</span>
                <span>{sub.name}</span>
              </button>
            );
          })}
        </div>

        {/* Type Filter Segmented Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100">
          <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl">
            <button
              onClick={() => setSelectedType('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                selectedType === 'all' ? 'bg-white text-slate-800 shadow-xs' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              Tất cả định dạng
            </button>
            <button
              onClick={() => setSelectedType('essay')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                selectedType === 'essay' ? 'bg-white text-amber-700 shadow-xs' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              ✍️ Tự luận
            </button>
            <button
              onClick={() => setSelectedType('quiz')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                selectedType === 'quiz' ? 'bg-white text-sky-700 shadow-xs' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              🎯 Trắc nghiệm
            </button>
          </div>

          <span className="text-xs font-semibold text-slate-400">
            Hiển thị <strong>{filteredExercises.length}</strong> bài tập phù hợp
          </span>
        </div>
      </div>

      {/* Exercise Cards Grid */}
      {filteredExercises.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-slate-200/80 shadow-xs space-y-3">
          <div className="w-16 h-16 bg-slate-100 text-slate-400 rounded-3xl flex items-center justify-center text-3xl mx-auto">
            🔍
          </div>
          <h3 className="text-lg font-bold text-slate-800">Không tìm thấy bài tập phù hợp</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Vui lòng thử tìm với từ khóa khác hoặc chuyển sang danh mục tất cả môn học.
          </p>
          <button
            onClick={() => {
              setSelectedSubject('all');
              setSelectedType('all');
              setSearchQuery('');
            }}
            className="text-xs font-bold text-sky-600 hover:underline pt-2 inline-block"
          >
            Đặt lại bộ lọc
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredExercises.map((item) => {
            const isEssay = item.type === 'essay';
            const subjectObj = subjects.find((s) => s.id === item.subject);

            return (
              <div
                key={item.id}
                className="bg-white rounded-3xl border border-slate-200/80 hover:border-sky-400 hover:shadow-lg hover:shadow-sky-500/10 transition-all p-5 flex flex-col justify-between group relative overflow-hidden"
              >
                <div>
                  {/* Top Tags */}
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-bold ${
                        isEssay ? 'bg-amber-100 text-amber-800' : 'bg-sky-100 text-sky-800'
                      }`}
                    >
                      {isEssay ? '✍️ Tự luận' : '🎯 Trắc nghiệm'}
                    </span>

                    <div className="flex items-center gap-1.5 text-xs">
                      <span className="px-2 py-0.5 rounded-lg bg-slate-100 text-slate-600 font-semibold">
                        {item.level}
                      </span>
                      <span className="font-bold text-slate-400">{item.grade}</span>
                    </div>
                  </div>

                  {/* Subject and Title */}
                  <div className="mb-2">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                      {subjectObj?.icon} {item.subjectName}
                    </span>
                    <h3 className="font-extrabold text-base text-slate-800 group-hover:text-sky-600 transition-colors line-clamp-2">
                      {item.title}
                    </h3>
                  </div>

                  {/* Description */}
                  <p className="text-xs text-slate-500 line-clamp-3 font-medium mb-4 leading-relaxed">
                    {item.description}
                  </p>

                  {/* Quick stats indicator */}
                  <div className="text-[11px] font-semibold text-slate-400 mb-4 flex items-center gap-2">
                    {isEssay ? (
                      <span className="inline-flex items-center gap-1 text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-lg">
                        <Check className="w-3.5 h-3.5" /> Có bài văn mẫu & barem chấm
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-lg">
                        <Award className="w-3.5 h-3.5" /> {item.questions?.length || 0} câu hỏi có đáp án & lời giải
                      </span>
                    )}
                  </div>
                </div>

                {/* Bottom Actions */}
                <div className="pt-3 border-t border-slate-100 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setPreviewItem(item)}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors cursor-pointer active:scale-95"
                    title="Xem trước câu hỏi và đáp án chi tiết"
                  >
                    <Eye className="w-3.5 h-3.5" /> Xem đáp án
                  </button>

                  <button
                    type="button"
                    onClick={() => onUseAssignment(item)}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-sky-500 hover:bg-sky-600 text-white text-xs font-extrabold shadow-sm shadow-sky-500/20 transition-all cursor-pointer active:scale-95"
                    title="Sử dụng bài này làm bài tập cho học sinh"
                  >
                    <Plus className="w-4 h-4" /> Dùng bài này
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Detailed Preview & Answer Key Modal */}
      {previewItem && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl w-full max-w-3xl my-6 max-h-[90vh] overflow-hidden flex flex-col shadow-2xl border border-slate-100 animate-in zoom-in-95">
            {/* Modal Header */}
            <div className="sticky top-0 bg-white/95 backdrop-blur-md px-6 py-4 border-b border-slate-100 flex items-center justify-between z-10">
              <div className="flex items-center gap-2.5 min-w-0">
                <div
                  className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ${
                    previewItem.type === 'essay'
                      ? 'bg-amber-100 text-amber-700'
                      : 'bg-sky-100 text-sky-700'
                  }`}
                >
                  {previewItem.type === 'essay' ? <FileText className="w-5 h-5" /> : <CheckCircle2 className="w-5 h-5" />}
                </div>
                <div className="min-w-0">
                  <h3 className="font-extrabold text-base sm:text-lg text-slate-800 truncate">
                    {previewItem.title}
                  </h3>
                  <div className="flex items-center gap-2 text-xs text-slate-500 font-semibold">
                    <span>{previewItem.subjectName}</span>
                    <span>·</span>
                    <span>{previewItem.type === 'essay' ? 'Tự luận' : 'Trắc nghiệm'}</span>
                    <span>·</span>
                    <span className="text-amber-600">{previewItem.level}</span>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setPreviewItem(null)}
                className="w-9 h-9 rounded-full bg-slate-100 text-slate-400 hover:text-slate-600 hover:bg-slate-200 flex items-center justify-center transition-colors cursor-pointer shrink-0 ml-2"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-6 flex-1">
              {/* Question / Assignment Prompt */}
              <div className="bg-sky-50/70 p-4 sm:p-5 rounded-2xl border border-sky-100">
                <span className="text-xs font-bold text-sky-800 uppercase tracking-wider block mb-1">
                  Yêu cầu đề bài:
                </span>
                <p className="text-sm font-medium text-slate-700 leading-relaxed whitespace-pre-wrap">
                  {previewItem.description}
                </p>
              </div>

              {/* Essay Content: Sample Answer & Grading Rubric */}
              {previewItem.type === 'essay' && (
                <div className="space-y-5">
                  {previewItem.sampleAnswer && (
                    <div className="bg-emerald-50/60 p-5 rounded-2xl border border-emerald-200">
                      <div className="flex items-center gap-2 mb-2">
                        <Award className="w-4 h-4 text-emerald-600" />
                        <span className="text-xs font-extrabold text-emerald-800 uppercase tracking-wider">
                          Bài làm mẫu tham khảo (Đạt điểm tối đa):
                        </span>
                      </div>
                      <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap font-medium bg-white p-4 rounded-xl border border-emerald-100 shadow-xs">
                        {previewItem.sampleAnswer}
                      </p>
                    </div>
                  )}

                  {previewItem.gradingCriteria && previewItem.gradingCriteria.length > 0 && (
                    <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200">
                      <span className="text-xs font-extrabold text-slate-700 uppercase tracking-wider block mb-2.5">
                        📋 Hướng dẫn & Tiêu chí chấm điểm (Barem):
                      </span>
                      <ul className="space-y-2">
                        {previewItem.gradingCriteria.map((c, i) => (
                          <li key={i} className="text-xs font-semibold text-slate-600 flex items-start gap-2">
                            <span className="w-5 h-5 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center text-[10px] font-black shrink-0 mt-0.5">
                              {i + 1}
                            </span>
                            <span>{c}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              {/* Quiz Content: Questions with Answer Keys & Explanations */}
              {previewItem.type === 'quiz' && (
                <div className="space-y-5">
                  <h4 className="text-sm font-extrabold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" /> Danh sách câu hỏi & Đáp án đúng:
                  </h4>

                  <div className="space-y-4">
                    {previewItem.questions?.map((q, idx) => (
                      <div key={idx} className="p-4 sm:p-5 rounded-2xl border border-slate-200 bg-white shadow-xs">
                        <div className="flex items-start gap-2 mb-3">
                          <span className="w-6 h-6 rounded-full bg-sky-100 text-sky-700 font-extrabold text-xs flex items-center justify-center shrink-0 mt-0.5">
                            {idx + 1}
                          </span>
                          <h5 className="font-bold text-sm text-slate-800 leading-snug">{q.q}</h5>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 ml-8 mb-3">
                          {q.options.map((opt, oIdx) => {
                            const isCorrect = opt === q.answer;
                            return (
                              <div
                                key={oIdx}
                                className={`px-3 py-2 rounded-xl text-xs font-semibold border flex items-center gap-2 ${
                                  isCorrect
                                    ? 'bg-emerald-50 border-emerald-300 text-emerald-800 font-bold'
                                    : 'bg-slate-50 border-slate-100 text-slate-600'
                                }`}
                              >
                                <span
                                  className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-black shrink-0 ${
                                    isCorrect ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-600'
                                  }`}
                                >
                                  {isCorrect ? '✓' : String.fromCharCode(65 + oIdx)}
                                </span>
                                <span>{opt}</span>
                                {isCorrect && <span className="ml-auto text-[10px] text-emerald-700 font-bold">(Đúng)</span>}
                              </div>
                            );
                          })}
                        </div>

                        {q.explanation && (
                          <div className="ml-8 p-3 rounded-xl bg-amber-50/80 border border-amber-200 text-xs text-amber-900 font-medium">
                            <span className="font-bold">💡 Giải thích chi tiết: </span>
                            {q.explanation}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="sticky bottom-0 bg-white/95 backdrop-blur-md px-6 py-4 border-t border-slate-100 flex items-center justify-end gap-3 z-10">
              <button
                type="button"
                onClick={() => setPreviewItem(null)}
                className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                Đóng
              </button>

              <button
                type="button"
                onClick={() => {
                  onUseAssignment(previewItem);
                  setPreviewItem(null);
                }}
                className="flex items-center gap-2 px-5 py-2.5 bg-sky-500 hover:bg-sky-600 active:scale-95 text-white rounded-xl text-xs sm:text-sm font-extrabold shadow-md shadow-sky-500/25 transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4" /> Dùng bài tập này ngay
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
