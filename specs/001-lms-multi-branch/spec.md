# Feature Specification: LMS đa ngành đa chi nhánh

**Feature Branch**: `001-lms-multi-branch`

**Created**: 2026-08-19

**Status**: Draft

**Input**: User description: "Xây dựng web app LMS đa ngành, đa chi nhánh; có landing page, tư vấn tuyển sinh, phụ huynh, trao đổi nội bộ, tài chính, thi đầu vào, lớp online, học liệu, thư viện số, thi thử và chương trình Tiếng Anh."

## Clarifications

### Session 2026-08-19

- Q: Khi license tháng hoặc năm hết hạn và hết cả grace period, tổ chức được tiếp tục sử dụng hệ thống ở mức nào? → A: Chỉ tắt các module hết entitlement; module lõi và module còn license tiếp tục hoạt động.
- Q: Khi thương mại hóa, mỗi khách hàng sẽ dùng một hệ thống cài riêng hay nhiều khách hàng cùng dùng chung một hệ thống đa tenant? → A: Dùng mô hình lai: SaaS đa tenant và instance/database riêng cho khách hàng lớn.
- Q: Trong mô hình SaaS đa tenant, dữ liệu của các khách hàng nên được lưu theo cách nào? → A: Mỗi tenant có database riêng kể cả trên SaaS.
- Q: Với SaaS dùng database riêng cho từng tenant, hệ thống cần hỗ trợ chuyển một tenant từ SaaS sang instance riêng như thế nào? → A: Chuyển một chiều từ SaaS sang instance riêng bằng quy trình migration có kiểm tra.
- Q: Khi chuyển tenant từ SaaS sang instance riêng, hệ thống có được phép dừng truy cập trong thời gian bảo trì không? → A: Cho phép downtime có lịch và thông báo trước cho người dùng.

## User Scenarios & Testing *(mandatory)*

### User Story 0 - Nền tảng giao diện và điều hướng thống nhất (Priority: P1)

Người dùng truy cập đúng không gian công khai, quản trị license hoặc LMS theo vai trò; các màn hình có cấu trúc, điều hướng, trạng thái tương tác và nhận diện nhất quán trên máy tính và thiết bị di động.

**Why this priority**: Nền tảng giao diện là điều kiện tiên quyết cho mọi quy trình nghiệp vụ; nếu shell, component và điều hướng không thống nhất, mỗi module sẽ tạo thêm sai lệch và tăng chi phí sửa lại.

**Independent Test**: Truy cập lần lượt landing page, license control plane và LMS application; kiểm tra điều hướng, responsive, bàn phím, light/dark/system, đổi preset và các trạng thái loading/empty/error mà không làm thay đổi cấu trúc hoặc hành vi nghiệp vụ.

**Acceptance Scenarios**:

1. **Given** người dùng truy cập một trong ba không gian sản phẩm, **When** chuyển giữa các trang trong cùng không gian, **Then** hệ thống giữ đúng shell, điều hướng, ngữ cảnh tổ chức và trạng thái hiển thị của không gian đó.
2. **Given** người dùng sử dụng máy tính hoặc thiết bị di động, **When** mở, thu gọn hoặc điều hướng bằng sidebar, **Then** sidebar có cấu trúc phân cấp, trạng thái active, submenu và account/workspace controls nhất quán, không che khuất nội dung.
3. **Given** quản trị viên thay preset hoặc chế độ sáng, tối hay theo hệ thống, **When** theme được preview hoặc publish, **Then** toàn bộ component dùng token mới mà không mất trạng thái giao diện hoặc thay đổi bố cục ngoài chủ ý.
4. **Given** người dùng chỉ dùng bàn phím hoặc công nghệ hỗ trợ, **When** tương tác với menu, dialog, dropdown, form và bảng dữ liệu, **Then** focus, nhãn, thứ tự tab và thao tác đóng/mở hoạt động đầy đủ.
5. **Given** dữ liệu đang tải, không có dữ liệu, có lỗi hoặc thao tác cần xác nhận, **When** trạng thái xuất hiện, **Then** hệ thống dùng mẫu hiển thị thống nhất và không gây dịch chuyển hoặc chồng lấn giao diện bất hợp lý.

---

### User Story 1 - Quản trị tổ chức, cài đặt và phân quyền (Priority: P1)

Quản trị viên trung tâm quản lý chi nhánh, ngành đào tạo, người dùng, vai trò, phạm vi dữ liệu và cài đặt dùng chung của toàn hệ thống.

**Why this priority**: Cấu trúc tổ chức, quyền truy cập và cấu hình nhất quán là nền tảng để vận hành an toàn nhiều chi nhánh.

**Independent Test**: Tạo chi nhánh, người dùng, vai trò và cài đặt chung; xác minh mỗi người chỉ thấy và thao tác trên dữ liệu đúng phạm vi.

**Acceptance Scenarios**:

1. **Given** trung tâm có nhiều chi nhánh, **When** quản trị viên tạo hoặc cập nhật chi nhánh, **Then** chi nhánh có thông tin nhận diện, trạng thái và người phụ trách để dùng cho các nghiệp vụ khác.
2. **Given** người dùng được gán vai trò và phạm vi, **When** người dùng truy cập dữ liệu, **Then** hệ thống chỉ hiển thị và cho phép thao tác trên bản ghi thuộc quyền được cấp.
3. **Given** quản trị viên cập nhật cài đặt chung, **When** cài đặt được lưu, **Then** các quy tắc liên quan như nhận diện thương hiệu, năm học, múi giờ, chính sách thông báo và chính sách học phí được áp dụng nhất quán.

---

### User Story 2 - Landing page và đăng ký tư vấn (Priority: P1)

Khách truy cập xem thông tin tổ chức, khóa học, giảng viên, học viên tiêu biểu, tin tức và thông báo; khách có thể gửi yêu cầu tư vấn và được chuyển cho đúng chi nhánh hoặc tư vấn viên.

**Why this priority**: Landing page là điểm tiếp cận công khai để tạo khách hàng tiềm năng và chuyển đổi sang đăng ký chương trình.

**Independent Test**: Quản trị viên công bố một khóa học và bài tin; khách tìm khóa học, gửi yêu cầu tư vấn và tư vấn viên xử lý yêu cầu đó.

**Acceptance Scenarios**:

1. **Given** nội dung đã được công bố, **When** khách truy cập landing page, **Then** khách xem được thông tin tổ chức, khóa học, đội ngũ giảng viên, học viên tiêu biểu, tin tức và thông báo theo trạng thái công bố.
2. **Given** khách cần hỗ trợ, **When** khách gửi biểu mẫu tư vấn, **Then** hệ thống lưu thông tin liên hệ, nhu cầu, nguồn đăng ký và phân tuyến tới chi nhánh hoặc tư vấn viên phù hợp.
3. **Given** nội dung landing page ở trạng thái bản nháp, **When** khách công khai truy cập, **Then** nội dung đó không được hiển thị.

---

### User Story 3 - Tư vấn tuyển sinh và ghi danh (Priority: P1)

Tư vấn viên quản lý khách hàng tiềm năng, nhu cầu học, lịch sử liên hệ, kết quả thi đầu vào, đề xuất khóa học và quá trình chuyển đổi thành học viên hoặc ghi danh lớp.

**Why this priority**: Tư vấn liên kết marketing, kiểm tra đầu vào, lớp học và tài chính thành quy trình tuyển sinh có thể đo lường.

**Independent Test**: Nhận một yêu cầu tư vấn, phân công tư vấn viên, ghi nhận kết quả tư vấn và chuyển khách đủ điều kiện thành ghi danh lớp.

**Acceptance Scenarios**:

1. **Given** khách gửi yêu cầu tư vấn, **When** tư vấn viên tiếp nhận, **Then** tư vấn viên xem được thông tin, lịch sử trao đổi, nhu cầu, trạng thái xử lý và bước tiếp theo.
2. **Given** khách cần đánh giá trình độ, **When** tư vấn viên chỉ định bài thi đầu vào, **Then** kết quả thi được liên kết với hồ sơ khách và dùng để đề xuất chương trình hoặc lớp phù hợp.
3. **Given** khách đồng ý đăng ký, **When** tư vấn viên hoàn tất hồ sơ, **Then** hệ thống tạo hoặc liên kết hồ sơ học viên, ghi danh lớp và khởi tạo nghĩa vụ tài chính theo chính sách.

---

### User Story 4 - Quản lý chương trình, lớp học và lịch học (Priority: P1)

Quản lý đào tạo tạo chương trình theo nhiều ngành, thiết lập khóa học, lớp học, giảng viên, chi nhánh, lịch học, nội dung và điều kiện hoàn thành.

**Why this priority**: Trung tâm cần nguồn dữ liệu thống nhất để mở lớp và cung cấp chương trình đào tạo nhất quán ở nhiều địa điểm.

**Independent Test**: Tạo chương trình, mở lớp tại một chi nhánh, gán giảng viên và lịch học, sau đó công bố lớp cho học viên.

**Acceptance Scenarios**:

1. **Given** ngành đào tạo đã tồn tại, **When** quản lý tạo chương trình và học phần, **Then** chương trình thể hiện mục tiêu, thời lượng, nội dung, điều kiện hoàn thành và trạng thái công bố.
2. **Given** chương trình đã công bố, **When** quản lý mở lớp tại chi nhánh, **Then** lớp có sức chứa, thời gian, địa điểm hoặc hình thức học, giảng viên và trạng thái tuyển sinh.
3. **Given** lịch học trùng lịch giảng viên hoặc phòng học, **When** người dùng lưu lịch, **Then** hệ thống cảnh báo xung đột và không xác nhận lịch đến khi được xử lý.
4. **Given** nội dung có phiên bản đang được học viên sử dụng, **When** quản lý cập nhật nội dung, **Then** lịch sử phiên bản được giữ lại và kết quả học tập đã ghi nhận không bị mất.

---

### User Story 5 - Học liệu, bài giảng và thư viện số (Priority: P1)

Giảng viên và biên tập viên tạo, kiểm duyệt, phân loại và công bố bài giảng, tài liệu, video, bài tập và tài nguyên số; học viên tìm kiếm, truy cập và lưu học liệu phù hợp.

**Why this priority**: Học liệu có tổ chức là thành phần cốt lõi của học tập tự chủ và cho phép tái sử dụng nguồn tri thức giữa các ngành, chi nhánh.

**Independent Test**: Công bố bài giảng và tài liệu thư viện có phân quyền; tìm kiếm bằng từ khóa với học viên đủ quyền và xác minh người ngoài quyền không thể truy cập.

**Acceptance Scenarios**:

1. **Given** giảng viên có quyền biên soạn, **When** tạo bài giảng với tài liệu, video hoặc bài tập và gửi công bố, **Then** học liệu được lưu với tác giả, phiên bản, chủ đề, trạng thái và phạm vi sử dụng.
2. **Given** tài liệu đã công bố trong thư viện số, **When** học viên tìm theo từ khóa, ngành, chủ đề hoặc loại tài liệu, **Then** hệ thống trả về các tài liệu học viên có quyền truy cập.
3. **Given** tài liệu chỉ dành cho lớp hoặc ngành cụ thể, **When** người dùng ngoài phạm vi mở liên kết trực tiếp, **Then** hệ thống từ chối truy cập và không hiển thị nội dung.
4. **Given** giảng viên tạo bài giảng, **When** thêm và sắp xếp các block văn bản, hình ảnh, gallery, audio, video, slide/PDF, file, quiz checkpoint hoặc speaking prompt, **Then** hệ thống validate schema từng block, lưu draft có phiên bản và preview đúng như học viên sẽ thấy.
5. **Given** một file media được tải lên, **When** upload hoàn tất, **Then** hệ thống kiểm tra loại file, checksum, quota và quyền, quét an toàn, xử lý derivative phù hợp và hiển thị rõ trạng thái uploading, scanning, processing, ready, rejected hoặc failed.
6. **Given** học viên có quyền mở bài giảng multimedia, **When** phát audio/video hoặc xem slide, **Then** hệ thống cấp playback URL có thời hạn, hỗ trợ caption/transcript khi có, lưu vị trí tiếp tục và không cấp source private cho người ngoài scope.

---

### User Story 6 - Học tập, phụ huynh và trao đổi ba bên (Priority: P1)

Học viên đăng ký lớp, theo dõi lịch, tiến độ và kết quả; phụ huynh được ủy quyền theo từng học viên để theo dõi thông tin và trao đổi với giáo viên hoặc tổ chức.

**Why this priority**: Việc phụ huynh đồng hành đúng phạm vi cải thiện theo dõi học tập, đặc biệt cho học viên chưa tự chủ, mà vẫn bảo vệ dữ liệu cá nhân.

**Independent Test**: Liên kết phụ huynh với học viên, cấp một tập quyền cụ thể, thực hiện trao đổi ba bên về lớp học và xác minh phụ huynh chỉ xem đúng nội dung được ủy quyền.

**Acceptance Scenarios**:

1. **Given** lớp đang tuyển sinh và còn chỗ, **When** học viên hoặc người được ủy quyền đăng ký, **Then** hệ thống tạo ghi danh, hiển thị lịch học và cập nhật số chỗ còn lại.
2. **Given** phụ huynh được liên kết với học viên, **When** quản trị viên cấu hình quyền theo hồ sơ, **Then** phụ huynh chỉ xem được lịch, điểm danh, tiến độ, học phí, điểm, nhận xét hoặc bài tập theo đúng tập quyền được cấp.
3. **Given** giáo viên, phụ huynh và tổ chức cùng thuộc một học viên hoặc lớp, **When** một bên tạo trao đổi ba bên, **Then** các bên được phép xem nhận thông báo và trả lời trong đúng phạm vi cuộc trao đổi.
4. **Given** học viên hoàn thành nội dung hoặc đánh giá, **When** kết quả được xác nhận, **Then** tiến độ, điểm và trạng thái hoàn thành được lưu trong hồ sơ học tập và hiển thị theo quyền.

---

### User Story 7 - Trao đổi nội bộ và thông báo (Priority: P2)

Quản trị viên, tư vấn viên, giáo viên, nhân viên và phụ huynh trao đổi theo nhóm, lớp, học viên hoặc công việc; trung tâm gửi thông báo có mục tiêu và theo dõi trạng thái tiếp nhận.

**Why this priority**: Vận hành đa chi nhánh cần kênh trao đổi có ngữ cảnh thay vì phân tán thông tin qua các công cụ không liên kết với hồ sơ học tập.

**Independent Test**: Tạo cuộc trao đổi nội bộ cho một lớp, gửi thông báo tới một chi nhánh và xác minh chỉ người đúng phạm vi nhận, xem hoặc trả lời được.

**Acceptance Scenarios**:

1. **Given** người dùng có quyền liên quan, **When** tạo cuộc trao đổi gắn với lớp, học viên hoặc yêu cầu tư vấn, **Then** hệ thống lưu thành viên, nội dung, thời điểm và lịch sử trao đổi.
2. **Given** quản trị viên gửi thông báo theo vai trò, chi nhánh, lớp hoặc nhóm người dùng, **When** thông báo được công bố, **Then** chỉ người nhận thuộc tiêu chí nhận được thông báo và trạng thái đã xem được ghi nhận.
3. **Given** vai trò hoặc quyền của một thành viên bị thu hồi, **When** thành viên mở cuộc trao đổi sau đó, **Then** hệ thống không cho phép truy cập ngoài phạm vi mới nhưng vẫn bảo toàn lịch sử theo chính sách.

---

### User Story 8 - Thi đầu vào, thi thử và xếp lớp (Priority: P1)

Khách hoặc học viên thực hiện bài thi đầu vào để xếp lớp, đồng thời làm bài thi thử theo ngành hoặc kỳ thi mục tiêu; giảng viên quản lý ngân hàng câu hỏi và kết quả đánh giá.

**Why this priority**: Thi đầu vào chuẩn hóa việc tư vấn và xếp lớp; thi thử giúp học viên đo năng lực và trung tâm cá nhân hóa hướng dẫn.

**Independent Test**: Tạo bài thi đầu vào, mời khách làm bài, xác minh kết quả gán cấp độ/lớp đề xuất; sau đó tạo thi thử và kiểm tra lịch sử lần làm, điểm và gợi ý ôn tập.

**Acceptance Scenarios**:

1. **Given** tư vấn viên chỉ định bài thi đầu vào, **When** khách hoàn thành bài thi, **Then** hệ thống ghi nhận kết quả, đề xuất cấp độ hoặc lớp theo quy tắc và thông báo cho tư vấn viên.
2. **Given** đợt thi thử đang mở, **When** học viên đủ điều kiện bắt đầu, **Then** hệ thống ghi nhận lần thi, thời gian, trạng thái làm bài và nộp bài theo quy định.
3. **Given** học viên đã nộp bài, **When** kết quả được chấm, **Then** học viên xem được điểm, kết quả theo chủ đề hoặc kỹ năng và nội dung cần ôn tập theo quyền công bố.
4. **Given** học viên đã dùng hết số lượt thi, **When** học viên cố bắt đầu lại, **Then** hệ thống từ chối tạo lượt mới và hiển thị điều kiện thi lại.
5. **Given** đề luyện tập hoặc thi thử có hình ảnh, audio, video, matching, ordering, file upload hoặc speaking response, **When** học viên làm bài trên desktop hoặc mobile, **Then** renderer hiển thị đúng loại câu hỏi, hỗ trợ bàn phím khi áp dụng, autosave theo sequence và không mất câu trả lời mới hơn khi request đến sai thứ tự.
6. **Given** học viên ghi âm câu trả lời nói, **When** dừng, nghe lại và nộp, **Then** hệ thống kiểm tra thời lượng/định dạng, upload resumable khi cần, liên kết asset với đúng attempt và chuyển sang chờ chấm thủ công thay vì tự hoàn thành.

---

### User Story 9 - Lộ trình học Tiếng Anh (Priority: P1)

Học viên Tiếng Anh làm kiểm tra xếp lớp, nhận lộ trình phù hợp, thực hành nghe, nói, đọc, viết, nhận phản hồi giáo viên và theo dõi tiến bộ từng kỹ năng.

**Why this priority**: Tiếng Anh có đặc thù đánh giá bốn kỹ năng, cần lộ trình và phản hồi chi tiết hơn các ngành chỉ dùng kiểm tra lý thuyết.

**Independent Test**: Ghi nhận kết quả xếp lớp, gán lộ trình; hoàn thành hoạt động cho bốn kỹ năng và xác minh hồ sơ hiển thị tiến bộ riêng từng kỹ năng.

**Acceptance Scenarios**:

1. **Given** học viên Tiếng Anh chưa có cấp độ, **When** hoàn thành bài kiểm tra xếp lớp, **Then** hệ thống ghi nhận kết quả và đề xuất cấp độ hoặc lộ trình theo quy tắc chương trình.
2. **Given** học viên thuộc lộ trình Tiếng Anh, **When** mở học phần, **Then** hệ thống hiển thị hoạt động nghe, nói, đọc, viết theo cấp độ và tiến độ hiện tại.
3. **Given** học viên nộp bài nói hoặc viết cần chấm thủ công, **When** giáo viên đánh giá và phản hồi, **Then** học viên nhận được điểm, nhận xét và trạng thái hoàn thành của kỹ năng tương ứng.

---

### User Story 10 - Lớp học online (Priority: P1)

Quản lý đào tạo và giáo viên tạo buổi học online, liên kết phòng họp trực tuyến, chia sẻ học liệu, theo dõi tham dự và cung cấp bản ghi buổi học theo quyền.

**Why this priority**: Lớp online mở rộng phạm vi phục vụ giữa các chi nhánh và đảm bảo lịch sử học tập được quản lý trong cùng hệ thống.

**Independent Test**: Tạo buổi học online cho một lớp, cấp liên kết phòng họp cho đúng người, ghi nhận tham dự và công bố bản ghi cho người học có quyền.

**Acceptance Scenarios**:

1. **Given** lớp có hình thức học online hoặc kết hợp, **When** giáo viên tạo buổi học, **Then** hệ thống lưu lịch, liên kết phòng họp, người tham dự, học liệu và trạng thái buổi học.
2. **Given** đến thời điểm học, **When** học viên được ghi danh mở buổi học, **Then** học viên nhận được liên kết tham gia theo quyền và hệ thống ghi nhận trạng thái tham dự từ nền tảng họp.
3. **Given** bản ghi buổi học đã sẵn sàng, **When** giáo viên công bố, **Then** chỉ người học, phụ huynh hoặc nhân sự được cấp quyền mới truy cập được bản ghi.

---

### User Story 11 - Tài chính, thanh toán và tích hợp kế toán (Priority: P1)

Nhân viên tài chính quản lý biểu phí, ưu đãi, hóa đơn, công nợ, thu/hoàn tiền; học viên hoặc phụ huynh thanh toán trực tuyến; hệ thống đồng bộ giao dịch được xác nhận sang kế toán hoặc ERP.

**Why this priority**: Học phí và công nợ là nghiệp vụ lõi của trung tâm, cần liên kết trực tiếp với ghi danh và giảm nhập liệu lặp giữa LMS và kế toán.

**Independent Test**: Tạo nghĩa vụ học phí từ ghi danh, áp dụng ưu đãi, thanh toán trực tuyến, kiểm tra công nợ được cập nhật và giao dịch đủ điều kiện được đồng bộ kế toán một lần.

**Acceptance Scenarios**:

1. **Given** học viên đã ghi danh, **When** nhân viên tạo hóa đơn theo biểu phí và ưu đãi, **Then** hệ thống tính nghĩa vụ tài chính, hạn thanh toán và công nợ còn lại theo chính sách.
2. **Given** phụ huynh hoặc học viên có hóa đơn chưa thanh toán, **When** thanh toán thành công, **Then** hệ thống ghi nhận giao dịch, cập nhật công nợ, phát hành biên nhận và thông báo cho các bên đúng quyền.
3. **Given** giao dịch đủ điều kiện đồng bộ, **When** hệ thống chuyển dữ liệu sang kế toán hoặc ERP, **Then** hệ thống ghi nhận trạng thái đồng bộ, mã đối chiếu và không tạo bản ghi trùng khi thực hiện lại.
4. **Given** giao dịch bị hủy, hoàn tiền hoặc đồng bộ thất bại, **When** nhân viên tài chính xử lý, **Then** hệ thống bảo toàn lịch sử, cập nhật trạng thái đúng quy trình và hiển thị việc cần xử lý tiếp theo.

---

### User Story 12 - Nhân sự và quản lý giáo viên (Priority: P1)

Phòng nhân sự quản lý hồ sơ nhân viên và giáo viên, tuyển dụng, hợp đồng, bằng cấp, kỹ năng, lịch làm việc, chấm công, nghỉ phép, đào tạo nội bộ, đánh giá hiệu suất và phân công theo chi nhánh.

**Why this priority**: Chất lượng và chi phí đào tạo phụ thuộc trực tiếp vào việc trung tâm quản lý đúng năng lực, lịch làm việc và trách nhiệm của đội ngũ.

**Independent Test**: Tạo hồ sơ giáo viên, phê duyệt hợp đồng, phân công lớp, ghi nhận chấm công và thực hiện một chu kỳ đánh giá hiệu suất.

**Acceptance Scenarios**:

1. **Given** một nhân viên hoặc giáo viên mới, **When** nhân sự tạo hồ sơ và hợp đồng, **Then** hệ thống lưu thông tin cá nhân, chi nhánh, chức danh, bằng cấp, kỹ năng, trạng thái làm việc và thời hạn hợp đồng.
2. **Given** giáo viên có lịch làm việc và năng lực đã được xác nhận, **When** quản lý phân công lớp, **Then** hệ thống kiểm tra xung đột lịch, điều kiện năng lực và ghi nhận trách nhiệm giảng dạy.
3. **Given** nhân viên gửi đơn nghỉ phép hoặc chấm công, **When** cấp có quyền xử lý, **Then** hệ thống lưu quy trình phê duyệt, số dư phép và dữ liệu công theo chi nhánh.
4. **Given** đến kỳ đánh giá, **When** quản lý và giáo viên hoàn tất đánh giá theo tiêu chí, **Then** hệ thống lưu kết quả, phản hồi, kế hoạch cải thiện và lịch sử đánh giá.

---

### User Story 13 - Tiền lương, thu chi và tài chính chi nhánh (Priority: P1)

Nhân viên tài chính quản lý ngân sách, khoản thu, khoản chi, đề nghị thanh toán, quỹ tiền mặt, mua sắm, công nợ, bảng lương và chi phí giáo viên theo từng chi nhánh; dữ liệu được tổng hợp và đồng bộ với kế toán.

**Why this priority**: Trung tâm cần kiểm soát lợi nhuận, dòng tiền và chi phí thực tế của từng chi nhánh, không chỉ học phí và công nợ học viên.

**Independent Test**: Tạo ngân sách chi nhánh, ghi nhận một khoản thu và khoản chi, chạy bảng lương giáo viên theo giờ/lớp, phê duyệt và đối chiếu với kế toán.

**Acceptance Scenarios**:

1. **Given** chi nhánh có ngân sách và danh mục tài chính, **When** nhân viên ghi nhận khoản thu hoặc chi, **Then** hệ thống yêu cầu chứng từ, danh mục, nguồn tiền, chi nhánh, người đề nghị và trạng thái phê duyệt.
2. **Given** giáo viên có dữ liệu hợp đồng, giờ dạy, buổi dạy hoặc lớp được xác nhận, **When** kỳ lương được tính, **Then** hệ thống tính lương cơ bản, phụ cấp, khấu trừ và thù lao theo giờ/lớp theo chính sách.
3. **Given** bảng lương đã được kiểm tra, **When** cấp có quyền phê duyệt, **Then** hệ thống khóa kỳ lương, phát hành phiếu lương, ghi nhận nghĩa vụ thanh toán và tạo dữ liệu đồng bộ kế toán.
4. **Given** chi nhánh vượt ngân sách hoặc khoản chi cần phê duyệt nhiều cấp, **When** người dùng gửi đề nghị, **Then** hệ thống định tuyến phê duyệt, cảnh báo vượt ngưỡng và không ghi nhận chi phí cuối cùng trước khi được duyệt.

---

### User Story 14 - AI hỗ trợ và tự động hóa có kiểm soát (Priority: P1)

Nhân viên, giáo viên, tư vấn viên và quản lý sử dụng AI để tư vấn khóa học, tạo và phân loại nội dung, cá nhân hóa học tập, chấm bài, dự báo rủi ro, hỗ trợ nhân sự và phát hiện bất thường tài chính; các quyết định ảnh hưởng lớn vẫn có cơ chế giám sát và khiếu nại.

**Why this priority**: AI có thể giảm khối lượng vận hành và nâng chất lượng hỗ trợ, nhưng dữ liệu giáo dục, nhân sự và tài chính cần kiểm soát trách nhiệm rõ ràng.

**Independent Test**: Chạy một tác vụ AI trên dữ liệu được cấp quyền, xem nguồn và lý do kết quả, phê duyệt hoặc chỉnh sửa đề xuất, rồi kiểm tra nhật ký và quyền khiếu nại.

**Acceptance Scenarios**:

1. **Given** tư vấn viên có quyền sử dụng trợ lý AI, **When** yêu cầu gợi ý khóa học từ nhu cầu và kết quả đầu vào, **Then** AI đưa ra đề xuất có căn cứ, mức độ tin cậy và cảnh báo khi dữ liệu chưa đủ.
2. **Given** giáo viên hoặc biên tập viên yêu cầu AI tạo câu hỏi, bài tập, phản hồi hoặc nội dung, **When** AI hoàn thành, **Then** kết quả ở trạng thái đề xuất, có nguồn tham chiếu và chỉ được công bố sau quy trình phù hợp hoặc theo chính sách đã cấu hình.
3. **Given** AI phân tích nguy cơ bỏ học, gian lận, chênh lệch lương hoặc bất thường thu chi, **When** phát hiện tín hiệu, **Then** hệ thống tạo cảnh báo giải thích được, không tự áp dụng hình phạt hoặc thay đổi lương nếu chưa có người có quyền xem xét.
4. **Given** người dùng bị ảnh hưởng bởi một quyết định hoặc điểm số có AI tham gia, **When** người dùng yêu cầu giải thích hoặc khiếu nại, **Then** hệ thống cung cấp thông tin xử lý, người duyệt, phiên bản mô hình/quy tắc liên quan và quy trình xem xét lại.

---

### User Story 15 - Vận hành và báo cáo đa chi nhánh (Priority: P2)

Lãnh đạo và quản lý chi nhánh theo dõi khách hàng tiềm năng, tuyển sinh, lớp, học liệu, kết quả học tập, trao đổi, nhân sự, giáo viên, thu chi, tiền lương và chỉ số vận hành theo chi nhánh, ngành và thời gian.

**Why this priority**: Báo cáo giúp điều phối nguồn lực, đánh giá hiệu quả từng chi nhánh và ra quyết định dựa trên dữ liệu.

**Independent Test**: Tạo dữ liệu ở hai chi nhánh, lọc báo cáo theo phạm vi và kiểm tra tổng số, xu hướng cùng quyền xem dữ liệu.

**Acceptance Scenarios**:

1. **Given** dữ liệu phát sinh ở nhiều chi nhánh, **When** lãnh đạo lọc theo ngành, chi nhánh và thời gian, **Then** hệ thống hiển thị chỉ số tương ứng và cho phép xuất báo cáo theo quyền.
2. **Given** quản lý chi nhánh chỉ được xem phạm vi đơn vị, **When** mở báo cáo, **Then** báo cáo không chứa dữ liệu chi nhánh khác.
3. **Given** lớp, chiến dịch tư vấn hoặc khoản công nợ vượt ngưỡng cấu hình, **When** người có quyền mở dashboard, **Then** đối tượng được đánh dấu cần chú ý cùng các chỉ số liên quan.

### Edge Cases

- Khi chi nhánh bị ngừng hoạt động, lớp, ghi danh, hóa đơn và lịch sử hiện tại phải được bảo toàn; không cho phát sinh ghi danh hoặc hóa đơn mới tại chi nhánh đó.
- Khi phụ huynh liên kết với nhiều học viên, dữ liệu và quyền phải tách theo từng học viên; thay đổi quyền của một học viên không được ảnh hưởng học viên khác.
- Khi liên kết phụ huynh bị thu hồi, phụ huynh không được xem dữ liệu mới, nhưng lịch sử trao đổi được bảo toàn theo chính sách lưu trữ.
- Khi khách gửi nhiều biểu mẫu tư vấn có cùng thông tin liên hệ, hệ thống phải hỗ trợ nhận diện hoặc gộp hồ sơ để tránh xử lý trùng.
- Khi tài liệu thư viện bị thu hồi hoặc thay phiên bản, hệ thống phải giữ lịch sử tham chiếu trong bài giảng và thông báo rõ việc không còn quyền truy cập nếu áp dụng.
- Khi học viên mất kết nối trong lúc nộp bài, hệ thống phải báo trạng thái rõ ràng, lưu phần đã xác nhận và không tạo nhiều lượt thi cho cùng lần làm.
- Khi bài nói hoặc viết chờ chấm thủ công, hệ thống phải hiển thị trạng thái chờ đánh giá và không tự xác nhận hoàn thành kỹ năng.
- Khi nền tảng họp hoặc cổng thanh toán không phản hồi, hệ thống phải hiển thị trạng thái chờ xác nhận, không tự ghi nhận thành công và cho phép đối soát sau đó.
- Khi giao dịch kế toán đồng bộ lại, hệ thống phải dùng mã đối chiếu để không tạo trùng giao dịch hoặc chứng từ.
- Khi kỳ lương đã khóa, mọi thay đổi về công, giờ dạy, phụ cấp hoặc khấu trừ phải đi qua quy trình điều chỉnh có phê duyệt và không sửa trực tiếp dữ liệu lịch sử.
- Khi nhân viên làm việc tại nhiều chi nhánh, công, lương, thu chi và quyền báo cáo phải được phân bổ theo từng chi nhánh mà không tính trùng.
- Khi khoản chi thiếu chứng từ hoặc vượt hạn mức, hệ thống phải giữ ở trạng thái chờ duyệt và không đưa vào số liệu đã quyết toán.
- Khi AI đưa ra kết quả thiếu căn cứ, mâu thuẫn hoặc có dấu hiệu thiên lệch, người dùng phải có thể đánh dấu, yêu cầu xem xét và ngăn kết quả được dùng cho quyết định cuối cùng.
- Khi dịch vụ AI không khả dụng, các quy trình nghiệp vụ chính phải cho phép xử lý thủ công và không làm mất dữ liệu đã nhập.
- Khi dữ liệu báo cáo không có bản ghi, hệ thống phải hiển thị kết quả rỗng có giải thích thay vì lỗi.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Hệ thống MUST quản lý trung tâm, chi nhánh, ngành đào tạo, phòng học, năm học và trạng thái hoạt động của từng đơn vị.
- **FR-002**: Hệ thống MUST cho phép tạo người dùng, gán vai trò và giới hạn phạm vi dữ liệu theo trung tâm, chi nhánh, lớp, học viên hoặc chức năng.
- **FR-003**: Hệ thống MUST kiểm tra quyền ở mọi thao tác xem, tạo, sửa, xóa, công bố, trao đổi, thanh toán và xuất dữ liệu.
- **FR-004**: Hệ thống MUST lưu nhật ký các sự kiện bảo mật và thay đổi quan trọng gồm người thực hiện, thời điểm, đối tượng và kết quả.
- **FR-005**: Hệ thống MUST cho phép quản trị viên cấu hình nhận diện thương hiệu, thông tin liên hệ, năm học, múi giờ, quy tắc thông báo, chính sách học phí và các danh mục dùng chung.
- **FR-006**: Hệ thống MUST quản lý hồ sơ nhân viên và giáo viên gồm thông tin cá nhân, chi nhánh, chức danh, bằng cấp, kỹ năng, chứng chỉ, hợp đồng, trạng thái làm việc và lịch sử thay đổi.
- **FR-007**: Hệ thống MUST hỗ trợ quy trình tuyển dụng, tiếp nhận, điều chuyển, tạm nghỉ, chấm dứt và lưu trữ hồ sơ nhân sự theo quyền.
- **FR-008**: Hệ thống MUST quản lý lịch làm việc, ca, chấm công, đơn nghỉ phép, số dư phép, phê duyệt và phân bổ thời gian làm việc theo chi nhánh.
- **FR-009**: Hệ thống MUST quản lý đào tạo nội bộ, năng lực, chứng chỉ bắt buộc và đánh giá hiệu suất theo vị trí, mục tiêu, kỳ đánh giá và kế hoạch cải thiện.
- **FR-010**: Hệ thống MUST cho phép quản lý giáo viên phân công lớp, môn, kỹ năng, lịch dạy, tải giảng dạy, thay thế và trách nhiệm chuyên môn.
- **FR-011**: Hệ thống MUST quản lý ngân sách, danh mục thu chi, quỹ tiền mặt, tài khoản thanh toán, đề nghị chi, chứng từ, mua sắm và quy trình phê duyệt theo chi nhánh.
- **FR-012**: Hệ thống MUST cung cấp sổ thu chi, dòng tiền, công nợ nội bộ, đối soát và báo cáo lãi lỗ hoặc kết quả hoạt động theo chi nhánh.
- **FR-013**: Hệ thống MUST hỗ trợ kỳ lương, dữ liệu công, giờ dạy, phụ cấp, khấu trừ, thuế, bảo hiểm, thưởng, phạt, phê duyệt bảng lương, phiếu lương và lịch sử điều chỉnh.
- **FR-014**: Hệ thống MUST tính thù lao giáo viên theo các chính sách có thể cấu hình gồm lương tháng, giờ dạy, buổi dạy, lớp, số học viên hoặc kết quả.
- **FR-015**: Hệ thống MUST khóa kỳ lương sau phê duyệt và yêu cầu quy trình điều chỉnh có lý do, người duyệt và nhật ký khi thay đổi dữ liệu lịch sử.
- **FR-016**: Hệ thống MUST đồng bộ dữ liệu nhân sự, tiền lương, thu chi và chứng từ đủ điều kiện với hệ thống kế toán hoặc ERP, có mã đối chiếu và chống tạo trùng.
- **FR-017**: Hệ thống MUST cho phép quản trị landing page tạo, xem trước, công bố, thu hồi và sắp xếp nội dung về tổ chức, khóa học, giáo viên, học viên tiêu biểu, tin tức, thông báo và khối kêu gọi đăng ký tư vấn.
- **FR-018**: Hệ thống MUST tiếp nhận biểu mẫu tư vấn từ landing page và lưu thông tin liên hệ, nhu cầu, nguồn đăng ký, chi nhánh quan tâm, trạng thái xử lý và lịch sử chăm sóc.
- **FR-019**: Hệ thống MUST cho phép phân công, chuyển giao và theo dõi khách hàng tiềm năng cho tư vấn viên theo chi nhánh, ngành, chương trình hoặc quy tắc phân tuyến.
- **FR-020**: Hệ thống MUST cho phép quản lý ngành đào tạo, chương trình, khóa học, học phần và nội dung học tập theo trạng thái bản nháp, công bố hoặc ngừng cung cấp.
- **FR-021**: Hệ thống MUST cho phép mở lớp theo chương trình tại chi nhánh với giảng viên, lịch, hình thức học, sức chứa và trạng thái tuyển sinh.
- **FR-022**: Hệ thống MUST phát hiện và cảnh báo xung đột lịch giữa lớp, giảng viên, phòng học và buổi học online trước khi lịch được xác nhận.
- **FR-023**: Hệ thống MUST hỗ trợ ghi danh, hủy ghi danh theo chính sách, danh sách chờ và theo dõi trạng thái học viên.
- **FR-024**: Hệ thống MUST cho phép tạo, phân loại, kiểm duyệt, phiên bản hóa và công bố bài giảng, tài liệu, video, bài tập và học liệu số theo ngành, chương trình, lớp hoặc toàn trung tâm.
- **FR-025**: Hệ thống MUST cung cấp thư viện số có tìm kiếm, lọc theo chủ đề, ngành, loại tài liệu và quyền truy cập; người dùng đủ quyền phải có thể xem, tải hoặc lưu tài liệu theo chính sách tài nguyên.
- **FR-026**: Hệ thống MUST lưu tiến độ, điểm, điểm danh, trạng thái tham dự và kết quả hoàn thành theo từng ghi danh.
- **FR-027**: Hệ thống MUST cho phép giảng viên quản lý học liệu được giao, điểm danh, bài đánh giá và phản hồi cho học viên trong phạm vi lớp phụ trách.
- **FR-028**: Hệ thống MUST cho phép liên kết một hoặc nhiều phụ huynh với học viên và cấu hình tập quyền riêng theo từng mối liên kết.
- **FR-029**: Hệ thống MUST cho phép phụ huynh được ủy quyền xem lịch, điểm danh, tiến độ, học phí, điểm, nhận xét, bài tập hoặc bản ghi lớp online theo tập quyền đã cấp.
- **FR-030**: Hệ thống MUST hỗ trợ trao đổi nội bộ và trao đổi giữa tổ chức, giáo viên, phụ huynh, học viên theo lớp, học viên, yêu cầu tư vấn hoặc nghiệp vụ liên quan.
- **FR-031**: Hệ thống MUST cho phép tạo cuộc trao đổi ba bên tổ chức, giáo viên và phụ huynh, quản lý thành viên, lịch sử, trạng thái và quyền tham gia theo phạm vi liên quan.
- **FR-032**: Hệ thống MUST cho phép gửi thông báo theo vai trò, chi nhánh, chương trình, lớp hoặc nhóm người dùng và ghi nhận trạng thái đã xem khi phù hợp.
- **FR-033**: Hệ thống MUST duy trì ngân hàng câu hỏi có chủ đề, kỹ năng, mức độ, đáp án, trạng thái duyệt và lịch sử thay đổi.
- **FR-034**: Hệ thống MUST hỗ trợ bài thi đầu vào gắn với khách hàng tiềm năng hoặc học viên và đề xuất cấp độ, chương trình hoặc lớp theo quy tắc được cấu hình.
- **FR-035**: Hệ thống MUST cho phép tạo và quản lý đợt thi thử với đề thi, đối tượng dự thi, thời hạn, số lượt, quy tắc chấm và chính sách công bố kết quả.
- **FR-036**: Hệ thống MUST ghi nhận trạng thái làm bài, thời gian, câu trả lời, lần nộp và kết quả từng lượt thi mà không tạo nhiều lượt cho cùng lần làm.
- **FR-037**: Hệ thống MUST hiển thị kết quả thi theo tổng điểm, chủ đề hoặc kỹ năng, cùng gợi ý nội dung ôn tập theo quyền công bố.
- **FR-038**: Hệ thống MUST hỗ trợ kiểm tra xếp lớp Tiếng Anh và gán cấp độ hoặc lộ trình theo quy tắc do quản lý đào tạo cấu hình.
- **FR-039**: Hệ thống MUST hỗ trợ nội dung, hoạt động, đánh giá, điểm và tiến độ tách biệt cho nghe, nói, đọc và viết.
- **FR-040**: Hệ thống MUST cho phép giảng viên nhận bài nói hoặc viết, chấm thủ công, phản hồi và cập nhật kết quả theo kỹ năng.
- **FR-041**: Hệ thống MUST hiển thị hồ sơ năng lực Tiếng Anh theo cấp độ, bốn kỹ năng, kết quả xếp lớp và các mốc đánh giá.
- **FR-042**: Hệ thống MUST cho phép tạo buổi học online gắn với lớp, bao gồm lịch, liên kết phòng họp, người tham dự, học liệu và trạng thái buổi học.
- **FR-043**: Hệ thống MUST đồng bộ hoặc ghi nhận trạng thái tham dự và bản ghi buổi học từ nền tảng họp trực tuyến theo quyền truy cập được cấp.
- **FR-044**: Hệ thống MUST quản lý biểu phí, ưu đãi, hóa đơn, hạn thanh toán, công nợ, thu tiền, hoàn tiền và biên nhận theo học viên, phụ huynh, lớp hoặc chương trình.
- **FR-045**: Hệ thống MUST cho phép học viên hoặc phụ huynh có quyền thực hiện thanh toán trực tuyến cho các hóa đơn được phép thanh toán.
- **FR-046**: Hệ thống MUST đồng bộ giao dịch và chứng từ học phí đủ điều kiện sang hệ thống kế toán hoặc ERP, lưu mã đối chiếu, trạng thái đồng bộ và ngăn bản ghi trùng.
- **FR-047**: Hệ thống MUST cung cấp dashboard và báo cáo có lọc theo chi nhánh, ngành, chương trình, lớp, trạng thái và thời gian.
- **FR-048**: Hệ thống MUST đưa vào báo cáo các chỉ số về khách hàng tiềm năng, tư vấn, ghi danh, tiến độ, sử dụng học liệu, thư viện số, thi, lớp online, công nợ, thanh toán, nhân sự, tiền lương và thu chi trong phạm vi quyền.
- **FR-049**: Hệ thống MUST giới hạn báo cáo và dữ liệu xuất theo quyền, đồng thời hiển thị nguồn dữ liệu và thời điểm cập nhật.
- **FR-050**: Hệ thống MUST hỗ trợ tìm kiếm, lọc, sắp xếp và phân trang cho các danh sách nghiệp vụ chính.
- **FR-051**: Hệ thống MUST hiển thị thông báo rõ ràng cho kết quả thành công, lỗi xác thực, lỗi quyền, xung đột dữ liệu, trạng thái chờ xử lý và lỗi đồng bộ bên ngoài.
- **FR-052**: Hệ thống MUST bảo toàn lịch sử nghiệp vụ khi chi nhánh, chương trình, lớp, người dùng, học liệu, tài liệu, đề thi, hóa đơn hoặc nội dung landing page chuyển sang trạng thái không hoạt động.
- **FR-053**: Hệ thống MUST bảo vệ dữ liệu cá nhân, kết quả học tập, bài làm, học liệu giới hạn quyền, trao đổi và dữ liệu tài chính khỏi người không được cấp quyền.
- **FR-054**: Hệ thống MUST cung cấp các tác vụ AI cho tư vấn khóa học, gợi ý học liệu, tạo nội dung và câu hỏi, cá nhân hóa lộ trình, hỗ trợ chấm bài, dự báo nguy cơ bỏ học và phát hiện bất thường vận hành.
- **FR-055**: Hệ thống MUST giới hạn AI theo quyền truy cập dữ liệu, ghi nhận phiên bản mô hình hoặc quy tắc, nguồn dữ liệu, đầu vào, đầu ra, người duyệt và thời điểm xử lý.
- **FR-056**: Hệ thống MUST cho phép cấu hình tác vụ AI ở chế độ đề xuất, tự động có điều kiện hoặc tự động; các quyết định ảnh hưởng đến điểm, lương, quyền truy cập, kỷ luật hoặc tài chính phải có giám sát và phê duyệt của người có quyền.
- **FR-057**: Hệ thống MUST cung cấp giải thích kết quả, cảnh báo độ tin cậy, cơ chế đánh dấu sai lệch, yêu cầu xem xét, khiếu nại và xử lý thủ công khi AI không khả dụng.
- **FR-058**: Hệ thống MUST không tự động áp dụng hình phạt, thay đổi lương, từ chối quyền lợi hoặc kết luận gian lận chỉ dựa trên một kết quả AI chưa được con người xem xét.
- **FR-059**: Khi license hết hạn và hết grace period, hệ thống MUST chỉ tắt các module mất entitlement, từ chối cả giao diện và API nghiệp vụ của các module đó, bảo toàn dữ liệu, đồng thời duy trì module lõi và các module còn entitlement.
- **FR-060**: Hệ thống MUST hỗ trợ mô hình triển khai lai gồm SaaS đa tenant cho khách hàng tiêu chuẩn và instance/database riêng cho khách hàng lớn; quyền, license, cấu hình, dữ liệu và báo cáo của mỗi tổ chức phải được cô lập trong cả hai mô hình.
- **FR-061**: Trong mô hình SaaS, mỗi tenant MUST sử dụng database riêng; hệ thống MUST quản lý provisioning, migration, backup, restore, quota, license và offboarding độc lập cho từng database tenant.
- **FR-062**: Hệ thống MUST hỗ trợ chuyển một chiều tenant từ SaaS sang instance riêng bằng quy trình migration có kiểm tra, lập lịch bảo trì, đối soát dữ liệu, kích hoạt license đích và kế hoạch rollback trước khi hoàn tất chuyển đổi.
- **FR-063**: Hệ thống MUST cho phép lập lịch và thông báo trước cửa sổ bảo trì khi chuyển tenant; trong cửa sổ đó tenant phải ở trạng thái maintenance hoặc read-only, mọi giao dịch mới phải được chặn rõ ràng, đồng bộ cuối phải hoàn tất trước cutover và rollback phải khả dụng nếu kiểm tra thất bại.
- **FR-064**: Hệ thống MUST duy trì ba không gian giao diện tách biệt: landing page công khai, license control plane cho nhà cung cấp và LMS application cho từng tổ chức; không gian công khai không dùng application shell quản trị và hai không gian quản trị không dùng lẫn điều hướng hoặc quyền.
- **FR-065**: Mỗi không gian quản trị MUST có application shell nhất quán gồm sidebar, header, vùng nội dung và footer; sidebar phải hỗ trợ workspace context, nhóm điều hướng, menu phân cấp, active state, thu gọn trên desktop và điều hướng dạng sheet trên mobile.
- **FR-066**: Hệ thống MUST dùng một thư viện component nền tảng thống nhất cho button, input, select, dialog, sheet, dropdown, tabs, table, tooltip, toast và các control tương tác; màn hình nghiệp vụ không được tạo bản mô phỏng riêng khi primitive tương ứng đã tồn tại.
- **FR-067**: Component dùng chung MUST hỗ trợ đầy đủ trạng thái mặc định, hover, focus, active, disabled, loading, validation và destructive khi áp dụng, đồng thời có hành vi bàn phím và thuộc tính trợ năng nhất quán.
- **FR-068**: Giao diện MUST dùng semantic design tokens cho màu, typography, spacing, radius, border, shadow và trạng thái; component nghiệp vụ không được gắn trực tiếp giá trị nhận diện thương hiệu khi token tương ứng đã tồn tại.
- **FR-069**: Theme MUST hỗ trợ light, dark và system; lần truy cập đầu khi chưa có lựa chọn lưu trước MUST dùng dark; preset phải có thể preview, kiểm tra độ tương phản, publish và rollback mà không làm mất lựa chọn chế độ hoặc yêu cầu sửa từng màn hình nghiệp vụ.
- **FR-070**: Giao diện MUST hỗ trợ tiếng Việt và tiếng Anh; lần truy cập đầu khi chưa có lựa chọn lưu trước MUST dùng tiếng Việt; nhãn điều hướng, trạng thái, thông báo, form validation và nội dung hệ thống không được hard-code chỉ cho một ngôn ngữ. Lựa chọn ngôn ngữ và theme phải được lưu độc lập theo người dùng hoặc thiết bị khi chưa đăng nhập.
- **FR-071**: Mọi trang dữ liệu MUST có mẫu nhất quán cho tiêu đề, hành động chính, bộ lọc, tìm kiếm, phân trang, loading, empty, error, forbidden và confirmation; nội dung không được chồng lấn hoặc gây thay đổi kích thước điều khiển ngoài dự kiến trên viewport được hỗ trợ.
- **FR-072**: Điều hướng nội bộ MUST giữ đúng trạng thái URL, lịch sử back/forward, deep link và active navigation; hệ thống không được tồn tại hai cơ chế định tuyến cạnh tranh trong cùng ứng dụng web.
- **FR-073**: Nền tảng giao diện MUST được nghiệm thu độc lập trên desktop và mobile trước khi triển khai thêm màn hình nghiệp vụ; mọi module mới phải tái sử dụng shell, component và token đã được nghiệm thu.
- **FR-074**: Hệ thống MUST cung cấp trình soạn bài giảng theo block có schema và phiên bản, tối thiểu hỗ trợ rich text, heading, callout, image, gallery, audio, video, slide/PDF, attachment, quiz checkpoint, flashcard, vocabulary và speaking prompt.
- **FR-075**: Hệ thống MUST quản lý lesson block và question type bằng registry nội bộ có type contract, runtime schema validation, migration version và capability editor/renderer/reviewer; tenant MUST NOT tải hoặc thực thi JavaScript plugin tùy ý.
- **FR-076**: Hệ thống MUST hỗ trợ upload private theo phiên có progress, retry, cancel, multipart hoặc resumable khi file lớn, checksum, MIME detection, quota, idempotency và trạng thái xử lý rõ ràng.
- **FR-077**: Hệ thống MUST có media processing pipeline cho virus scan, image derivative/thumbnail, audio normalization/metadata, video metadata/thumbnail và HLS hoặc provider adapter, slide/PDF conversion/thumbnail, caption/transcript metadata và search indexing phù hợp loại tài nguyên.
- **FR-078**: Hệ thống MUST cung cấp player/viewer có quyền cho image, audio, video và slide/PDF, hỗ trợ keyboard, responsive, resume progress, playback speed khi áp dụng, caption/transcript và signed URL có thời hạn.
- **FR-079**: Hệ thống MUST hỗ trợ question schema và renderer tối thiểu cho single choice, multiple choice, true/false, short/long answer, fill blank, matching, ordering, image choice, audio/video prompt, file upload và speaking response.
- **FR-080**: Assessment attempt MUST autosave câu trả lời bằng sequence/version chống ghi đè ngược, hiển thị connectivity/save state, cho retry an toàn và liên kết media response đúng attempt/item mà không tạo side effect trùng.
- **FR-081**: Speaking và writing response MUST hỗ trợ manual review, rubric, feedback và timestamp annotation khi áp dụng; không tự xác nhận hoàn thành trước review theo policy.
- **FR-082**: Hệ thống MUST giữ source media và derivative ở private storage, kiểm tra authorization trước mọi upload/download/playback và không coi upload hoàn tất là media ready trước khi scan/processing thành công.
- **FR-083**: MCP MAY được dùng cho công cụ phát triển hoặc AI integration có policy, nhưng lesson renderer, media player, recorder, uploader và assessment engine MUST hoạt động không phụ thuộc MCP.

### Key Entities *(include if feature involves data)*

- **Trung tâm**: Đơn vị sở hữu hệ thống, chi nhánh, chương trình, người dùng và chính sách.
- **Chi nhánh**: Đơn vị vận hành thuộc trung tâm có trạng thái, thông tin liên hệ và phạm vi dữ liệu riêng.
- **Người dùng**: Cá nhân sử dụng hệ thống với hồ sơ, vai trò, trạng thái tài khoản và phạm vi truy cập.
- **Hồ sơ nhân sự**: Hồ sơ nhân viên hoặc giáo viên gồm vị trí, chi nhánh, năng lực, chứng chỉ, hợp đồng, lịch sử làm việc và trạng thái.
- **Phân công giảng dạy**: Trách nhiệm giảng dạy của giáo viên theo lớp, môn, kỹ năng, lịch, tải công việc và trạng thái thực hiện.
- **Chấm công và nghỉ phép**: Dữ liệu ca làm, thời gian làm việc, đơn nghỉ, số dư phép và lịch sử phê duyệt.
- **Đánh giá hiệu suất**: Mục tiêu, tiêu chí, phản hồi, kết quả, kế hoạch cải thiện và lịch sử đánh giá nhân sự.
- **Ngân sách chi nhánh**: Hạn mức thu chi, kỳ ngân sách, danh mục và trạng thái theo dõi của một chi nhánh.
- **Khoản thu chi**: Giao dịch vận hành có danh mục, chứng từ, nguồn tiền, chi nhánh, người đề nghị, trạng thái phê duyệt và mã đối chiếu.
- **Kỳ lương và phiếu lương**: Kỳ tính lương, dữ liệu công, thù lao, phụ cấp, khấu trừ, thuế, bảo hiểm, trạng thái phê duyệt và lịch sử điều chỉnh.
- **Tác vụ AI**: Một yêu cầu AI có mục đích, dữ liệu được phép dùng, đầu vào, đầu ra, độ tin cậy, phiên bản, người duyệt và trạng thái xử lý.
- **Phụ huynh và ủy quyền**: Hồ sơ phụ huynh cùng mối liên kết với học viên, tập quyền theo từng học viên và thời hạn hiệu lực.
- **Nội dung landing page**: Nội dung công khai về tổ chức, chương trình, con người, tin tức, thông báo và đăng ký tư vấn có trạng thái công bố.
- **Khách hàng tiềm năng**: Cá nhân quan tâm khóa học, có nhu cầu, nguồn tiếp cận, tư vấn viên phụ trách, lịch sử chăm sóc và trạng thái chuyển đổi.
- **Ngành đào tạo**: Nhóm chuyên môn tổ chức các chương trình và khóa học liên quan.
- **Chương trình**: Lộ trình đào tạo gồm mục tiêu, học phần, điều kiện hoàn thành và phiên bản nội dung.
- **Lớp học**: Một đợt triển khai chương trình tại chi nhánh, trực tiếp, online hoặc kết hợp; có lịch, giáo viên và sức chứa.
- **Ghi danh**: Quan hệ giữa học viên và lớp, gồm trạng thái, tiến độ, kết quả và lịch sử thay đổi.
- **Học liệu**: Bài giảng, video, bài tập hoặc tài nguyên học tập có tác giả, phiên bản, trạng thái công bố và phạm vi dùng.
- **Tài nguyên thư viện số**: Tài liệu tham khảo có phân loại, mô tả, quyền truy cập, chính sách dùng và lịch sử phiên bản.
- **Cuộc trao đổi**: Kênh thảo luận gắn với thành viên, lớp, học viên hoặc nghiệp vụ; có lịch sử, trạng thái và phạm vi quyền.
- **Ngân hàng câu hỏi**: Tập hợp câu hỏi theo ngành, chủ đề, kỹ năng, mức độ và trạng thái duyệt.
- **Đợt đánh giá**: Thi đầu vào hoặc thi thử có đề, đối tượng, thời hạn, số lượt, quy tắc chấm và chính sách công bố.
- **Lượt thi**: Một lần làm bài gồm thời gian, câu trả lời, trạng thái nộp và kết quả.
- **Lộ trình Tiếng Anh**: Chuỗi học phần và hoạt động theo cấp độ, có mục tiêu riêng cho nghe, nói, đọc, viết.
- **Hồ sơ năng lực Tiếng Anh**: Kết quả xếp lớp, điểm và tiến độ theo bốn kỹ năng qua các mốc đánh giá.
- **Buổi học online**: Buổi học gắn với lớp, lịch, liên kết họp, thành phần tham dự, học liệu, trạng thái và bản ghi.
- **Hóa đơn**: Nghĩa vụ tài chính gồm biểu phí, ưu đãi, hạn thanh toán, số tiền và trạng thái công nợ.
- **Giao dịch thanh toán**: Bản ghi thu, hoàn hoặc điều chỉnh tiền, kèm trạng thái, biên nhận và mã đối chiếu kế toán.
- **Báo cáo**: Chỉ số marketing, vận hành, đào tạo, học liệu, đánh giá và tài chính được tổng hợp theo quyền.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Quản trị viên thiết lập chi nhánh, vai trò và cài đặt cơ bản trong tối đa 10 phút.
- **SC-002**: Ít nhất 90% khách thử nghiệm tìm được khóa học phù hợp và gửi yêu cầu tư vấn trong tối đa 3 phút.
- **SC-003**: Ít nhất 95% yêu cầu tư vấn mới được phân công đúng chi nhánh hoặc tư vấn viên theo quy tắc cấu hình.
- **SC-004**: Nhân viên tạo và công bố lớp đầy đủ thông tin trong tối đa 5 phút sau khi chương trình đã tồn tại.
- **SC-005**: Ít nhất 90% học viên thử nghiệm hoàn tất đăng ký lớp, tìm lịch và mở học liệu được giao trong lần đầu sử dụng.
- **SC-006**: Ít nhất 95% lượt cập nhật tiến độ hoặc điểm danh hiển thị cho người dùng có quyền trong vòng 5 giây sau khi xác nhận.
- **SC-007**: Ít nhất 90% phụ huynh thử nghiệm chỉ xem được đúng tập dữ liệu được ủy quyền và hoàn tất một trao đổi với giáo viên trong tối đa 2 phút.
- **SC-008**: Ít nhất 90% người dùng thử nghiệm tìm được tài liệu thư viện phù hợp qua từ khóa hoặc bộ lọc trong tối đa 2 phút.
- **SC-009**: Ít nhất 95% học viên hoàn tất bài thi đầu vào hoặc thi thử trong thời hạn nhận được trạng thái nộp bài và kết quả chấm tự động trong vòng 10 giây sau khi nộp.
- **SC-010**: Ít nhất 90% học viên Tiếng Anh thử nghiệm hoàn thành xếp lớp và xem lộ trình cùng tiến bộ bốn kỹ năng trong lần đầu sử dụng.
- **SC-011**: Ít nhất 95% buổi học online thử nghiệm ghi nhận đúng lịch, người tham dự và trạng thái tham dự từ nền tảng họp.
- **SC-012**: Ít nhất 98% thanh toán trực tuyến thành công cập nhật công nợ và phát hành biên nhận trong vòng 1 phút sau khi được xác nhận.
- **SC-013**: 100% giao dịch được đồng bộ lại trong kịch bản kiểm thử không tạo bản ghi kế toán hoặc ERP trùng lặp.
- **SC-014**: Ít nhất 95% kỳ lương thử nghiệm tính đúng theo dữ liệu công, giờ dạy và chính sách đã được phê duyệt; mọi điều chỉnh sau khóa kỳ đều có lịch sử truy vết.
- **SC-015**: Ít nhất 95% khoản thu chi thử nghiệm được phân bổ đúng chi nhánh, danh mục và trạng thái phê duyệt; khoản vượt hạn mức luôn được cảnh báo trước khi quyết toán.
- **SC-016**: Ít nhất 90% nhân sự thử nghiệm hoàn thành các thao tác hồ sơ, chấm công, nghỉ phép hoặc xem phiếu lương trong tối đa 3 phút.
- **SC-017**: 100% tác vụ AI thử nghiệm dùng dữ liệu có quyền truy cập, có nhật ký đầu vào/đầu ra và cho phép người có thẩm quyền yêu cầu xem xét lại.
- **SC-018**: 100% thao tác truy cập trái quyền trong các kịch bản kiểm thử bị từ chối và không làm lộ dữ liệu ngoài phạm vi.
- **SC-019**: Người quản lý tạo báo cáo theo chi nhánh, ngành và thời gian trong tối đa 2 phút; ít nhất 95% báo cáo thử nghiệm khớp dữ liệu nguồn.
- **SC-020**: Hệ thống hỗ trợ tối thiểu 50 chi nhánh, 100.000 hồ sơ học viên, 5.000 lớp hoạt động và 100.000 tài nguyên thư viện mà thao tác chính vẫn đáp ứng mục tiêu thời gian nêu trên.
- **SC-021**: 100% kiểm thử truy cập chéo tenant trong mô hình SaaS và truy cập sai instance trong mô hình cài riêng bị từ chối; backup, restore và license của một tổ chức không làm thay đổi dữ liệu của tổ chức khác.
- **SC-022**: 100% tenant SaaS thử nghiệm có database, backup, migration status, quota và license state riêng; thao tác provisioning, restore hoặc offboarding của một tenant không làm gián đoạn hoặc thay đổi dữ liệu của tenant khác.
- **SC-023**: 100% lần chuyển tenant thử nghiệm từ SaaS sang instance riêng có backup trước chuyển đổi, kiểm tra toàn vẹn dữ liệu, đối soát số liệu, license đích hoạt động và rollback khả dụng trước khi mở instance mới.
- **SC-024**: 100% màn hình quản trị được chọn trong bộ nghiệm thu hiển thị đúng shell và không có nội dung chồng lấn tại các viewport desktop và mobile mục tiêu.
- **SC-025**: 100% tương tác chính trong sidebar, dialog, dropdown, form và tabs của bộ nghiệm thu có thể hoàn thành chỉ bằng bàn phím và có focus nhìn thấy được.
- **SC-026**: 100% component trong bộ nghiệm thu đổi đồng bộ theo preset và light/dark/system; refresh hoặc chuyển trang không làm mất theme đã chọn.
- **SC-027**: Ít nhất 90% người dùng thử nghiệm xác định đúng vị trí hiện tại và chuyển tới chức năng mục tiêu trong tối đa ba thao tác điều hướng.
- **SC-028**: 100% route trong bộ nghiệm thu hỗ trợ tải trực tiếp, refresh, back/forward và deep link mà không mất shell hoặc active navigation.
- **SC-029**: 100% lesson block và question type trong MVP vượt qua schema validation, version migration test, renderer/editor parity và negative test không thực thi payload code không tin cậy.
- **SC-030**: Ít nhất 95% upload media thử nghiệm có thể retry hoặc resume sau gián đoạn mà không tạo asset trùng; 100% file rejected/failed không được phát như ready.
- **SC-031**: Ít nhất 95% image/audio/video/slide asset trong bộ nghiệm thu tạo đủ derivative bắt buộc và chuyển trạng thái ready trong ngưỡng cấu hình theo kích thước; mọi lỗi có trạng thái và thao tác retry/audit.
- **SC-032**: 100% playback/download trái scope bị từ chối; signed URL hết hạn không tiếp tục cấp quyền ngoài access policy hiện hành.
- **SC-033**: 100% assessment autosave test có request đến sai thứ tự giữ câu trả lời sequence mới nhất; submit lặp và media response retry không tạo attempt hoặc answer effect trùng.
- **SC-034**: 100% luồng speaking MVP cho phép ghi âm, nghe lại, nộp, chờ chấm và giáo viên phản hồi trên desktop/mobile được hỗ trợ; khi microphone/provider lỗi có hướng dẫn retry hoặc upload file theo policy.

## Assumptions

- Trung tâm có một mô hình tổ chức thống nhất; người dùng và lớp học có thể gắn với một hoặc nhiều chi nhánh theo quyền được cấp.
- Landing page được quản lý trong cùng hệ thống và nội dung công khai chỉ hiển thị sau khi được người có quyền công bố.
- Phụ huynh được ủy quyền theo từng học viên; trung tâm cấu hình tập quyền và thời hạn theo độ tuổi, chương trình hoặc hồ sơ.
- Phiên bản đầu tập trung vào web responsive; ứng dụng di động riêng và phòng học trực tiếp tích hợp hoàn toàn nằm ngoài phạm vi.
- Nền tảng giao diện, shell quản trị và component dùng chung phải được chốt trước các màn hình nghiệp vụ; thay đổi theme không được thay đổi cấu trúc thông tin hoặc quyền truy cập.
- Giao diện mặc định là tiếng Việt và dark theme; người dùng có thể chuyển sang tiếng Anh, light theme hoặc system theme mà không mất ngữ cảnh trang và dữ liệu đang xem.
- Landing page, license control plane và LMS application là ba trải nghiệm tách biệt nhưng dùng chung các quy tắc accessibility, responsive, i18n và semantic token khi phù hợp.
- Lớp online sử dụng nền tảng họp trực tuyến có sẵn để cung cấp phòng họp, trạng thái tham dự và bản ghi; hệ thống không tự vận hành hạ tầng họp thời gian thực.
- Trung tâm cung cấp quy tắc hoàn thành, hủy ghi danh, chứng nhận, xếp lớp, thang điểm, phân tuyến tư vấn, học phí và ngưỡng cảnh báo trước khi triển khai.
- Bản đầu hỗ trợ lesson block, player/viewer, media upload/processing và question renderer nội bộ trên web; chấm phát âm tự động, proctoring chuyên dụng, collaborative slide editing, animation PowerPoint và import/export SCORM/xAPI/H5P được xem là giai đoạn sau sau khi có yêu cầu tương thích cụ thể.
- Bài nói và viết Tiếng Anh được giáo viên chấm và phản hồi trong phiên bản đầu.
- Trung tâm cung cấp thông tin kỹ thuật, quyền truy cập và quy tắc đối soát cho cổng thanh toán cùng hệ thống kế toán hoặc ERP cần tích hợp.
- Payroll đầy đủ bao gồm thuế và bảo hiểm theo quy định áp dụng; trung tâm chịu trách nhiệm cung cấp công thức, ngưỡng, kỳ tính và dữ liệu pháp lý cần thiết trước khi vận hành.
- Các quyết định AI ảnh hưởng đến điểm, lương, quyền lợi, kỷ luật hoặc kết luận gian lận phải có người chịu trách nhiệm phê duyệt; AI tự động hóa không loại bỏ quyền xem xét của con người.
- Dữ liệu dùng cho AI được xử lý theo mục đích, phạm vi quyền, chính sách bảo mật và thời hạn lưu trữ; dữ liệu nhạy cảm không được dùng ngoài mục đích đã phê duyệt.
- Dữ liệu cá nhân, kết quả học tập, bài làm, trao đổi, nhân sự, tiền lương và tài chính được lưu theo chính sách bảo mật và thời hạn lưu trữ do trung tâm ban hành.
- Mô hình thương mại hỗ trợ SaaS đa tenant và instance riêng; mỗi tenant SaaS sử dụng database riêng, còn khách hàng lớn có thể dùng instance và database riêng.
- Tenant có thể chuyển một chiều từ SaaS sang instance riêng qua migration có preflight, backup, final sync, đối soát, license đích và rollback.
- Migration tenant được thực hiện trong cửa sổ bảo trì có lịch và thông báo trước; tenant khác không bị downtime hoặc thay đổi dữ liệu.

## Multimedia MVP Boundary

- MVP lesson: text, image/gallery, attachment, audio, video, PDF/slide, quiz checkpoint, flashcard, vocabulary và speaking prompt.
- MVP assessment: choice, true/false, text, fill blank, matching, ordering, media prompt, file upload và speaking response; speaking/writing chấm thủ công.
- MVP processing: private resumable upload, checksum/MIME/quota, scan, image derivative, audio normalization, video thumbnail/HLS hoặc provider adapter, PPTX/PDF preview derivative và retry state.
- Advanced sau MVP: image hotspot, interactive transcript, subtitle editor nâng cao, adaptive learning, AI transcription/pronunciation, proctoring, collaborative authoring và SCORM/xAPI/H5P interoperability.
- Runtime LMS không phụ thuộc MCP; plugin là registry nội bộ được build/deploy cùng release và phải qua schema, security, accessibility, migration và license review.

## Proposed Future Enhancements

- Quản lý bài tập, hạn nộp, chấm điểm theo rubric và đánh giá đồng đẳng.
- Lộ trình học thích ứng, gợi ý nội dung cá nhân hóa và cảnh báo nguy cơ bỏ học nâng cao.
- AI chấm phát âm, nhận xét bài viết, tạo kế hoạch bài dạy và trợ giảng theo ngữ cảnh lớp.
- AI dự báo tuyển sinh, tối ưu phân công giáo viên, dự báo nhu cầu nhân sự và lập kế hoạch ca.
- AI phát hiện gian lận thi, bất thường thu chi hoặc bất thường payroll với quy trình kiểm tra và phê duyệt.
- AI đọc chứng từ, trích xuất dữ liệu hóa đơn và đối chiếu giao dịch với kế toán.
- Huy hiệu, điểm thưởng, bảng xếp hạng hoặc thử thách học tập để tăng gắn kết.
- Quản lý phòng học, thiết bị, mượn trả tài sản và sự kiện tại chi nhánh.
- Quản lý cựu học viên, việc làm, đối tác doanh nghiệp và khảo sát sau tốt nghiệp.
- Cổng tự phục vụ trên ứng dụng di động, hỗ trợ ngoại tuyến và thông báo đẩy.

