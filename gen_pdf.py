# -*- coding: utf-8 -*-
from fpdf import FPDF
import os

class QuizPDF(FPDF):
    def header(self):
        if self.page_no() > 1:
            self.set_font('DejaVu', 'I', 8)
            self.set_text_color(130, 130, 130)
            self.cell(0, 8, 'ĐỀ TRẮC NGHIỆM ÔN TẬP HTML VÀ CSS - 120 CÂU', align='C')
            self.ln(10)

    def footer(self):
        self.set_y(-15)
        self.set_font('DejaVu', 'I', 8)
        self.set_text_color(130, 130, 130)
        self.cell(0, 10, f'Trang {self.page_no()}/{{nb}}', align='C')

sections = [
    ("Phần 1: Khái niệm cơ bản và Liên kết", 0, 20),
    ("Phần 2: Hình ảnh và Đa phương tiện", 20, 20),
    ("Phần 3: Biểu mẫu – Form", 40, 30),
    ("Phần 4: CSS Căn bản và Bộ chọn", 70, 20),
    ("Phần 5: Thuộc tính CSS, Bố cục & Display", 90, 30),
]

questions = [
    # Phần 1
    ("Siêu văn bản là gì?", ["Một loại văn bản chỉ chứa văn bản thuần túy.", "Văn bản chứa nhiều loại dữ liệu và các liên kết tới siêu văn bản khác.", "Văn bản chứa hình ảnh và âm thanh.", "Văn bản chỉ chứa liên kết tới các trang web khác."], 1),
    ("Đường dẫn tương đối là gì?", ["Đường dẫn chứa giao thức và tên miền đầy đủ.", "Đường dẫn chỉ cần cung cấp tên đường dẫn đến tài liệu trong cùng máy chủ.", "Đường dẫn chứa thông tin về địa chỉ IP của máy chủ.", "Đường dẫn chỉ cần chứa tên tệp tin."], 1),
    ("Thẻ HTML nào được sử dụng để tạo liên kết?", ["Thẻ link.", "Thẻ a.", "Thẻ href.", "Thẻ anchor."], 1),
    ("Để tạo liên kết tới một trang web khác trên Internet, ta sử dụng loại đường dẫn nào?", ["Đường dẫn tuyệt đối.", "Đường dẫn tương đối.", "Đường dẫn ảo.", "Đường dẫn tĩnh."], 0),
    ("Liên kết nội bộ là gì?", ["Liên kết tới một trang web khác trên Internet.", "Liên kết tới một phần khác của cùng trang web.", "Liên kết tới một máy chủ khác.", "Liên kết tới một tài liệu khác trên cùng máy chủ."], 1),
    ("Thẻ HTML nào được sử dụng để tạo mã định danh cho phần tử, giúp liên kết đến vị trí cụ thể trong trang web?", ["Thẻ class.", "Thẻ div.", "Thẻ id.", "Thẻ section."], 2),
    ('Thuộc tính nào của thẻ "a" dùng để xác định đường dẫn liên kết?', ["src.", "href.", "link.", "target."], 1),
    ('Để mở liên kết trong một cửa sổ hoặc tab mới, ta sử dụng thuộc tính nào của thẻ "a"?', ['target="_blank".', 'href="_blank".', 'rel="_blank".', 'window="_blank".'], 0),
    ('Để tạo liên kết đến hình ảnh, ta cần chỉ định URL của hình ảnh vào thuộc tính nào của thẻ "a"?', ["src.", "img.", "href.", "alt."], 0),
    ('Trong HTML, để tạo liên kết nội bộ đến một phần tử có id là "footer", cú pháp đúng là gì?', ['a href="#footer"', 'a link="footer"', 'a id="footer"', 'a href="footer"'], 0),
    ("Liên kết chỉ có thể dẫn đến một trang web khác, không thể liên kết đến tệp trong máy tính là phát biểu đúng hay sai?", ["Đúng", "Sai"], 1),
    ("Liên kết có thể được tạo từ văn bản, hình ảnh hoặc bất kỳ phần tử nào trên trang web là đúng hay sai?", ["Đúng", "Sai"], 0),
    ("Khi nhấp vào một liên kết, nó sẽ luôn mở trong cùng một cửa sổ trình duyệt, không thể thay đổi hành vi này là đúng hay sai?", ["Đúng", "Sai"], 1),
    ('Thẻ "a" có bắt buộc phải luôn có thuộc tính href để tạo liên kết hoạt động được không?', ["Bắt buộc phải có", "Không bắt buộc"], 1),
    ('Đường dẫn tương đối có luôn bắt đầu bằng "http://" hoặc "https://" không?', ["Có, luôn bắt đầu bằng http:// hoặc https://", "Không, đường dẫn tương đối dựa trên vị trí tệp hiện tại"], 1),
    ("Ký tự nào được sử dụng cùng với giá trị id để tạo liên kết đến một vị trí cụ thể trong trang?", ["Ký tự @", "Ký tự #", "Ký tự $", "Ký tự *"], 1),
    ("Văn bản siêu liên kết mặc định có đặc điểm nhận dạng cơ bản nào trên trình duyệt?", ["Gạch chân và có màu xanh dương", "In đậm và có màu đỏ", "In nghiêng và có màu đen", "Gạch bỏ và có màu xám"], 0),
    ("Thẻ nào xác định nội dung chính của toàn bộ tài liệu HTML hiển thị cho người dùng?", ["Thẻ head", "Thẻ body", "Thẻ title", "Thẻ html"], 1),
    ("Mục đích chính của việc sử dụng siêu liên kết (hyperlink) là gì?", ["Giúp điều hướng giữa các trang hoặc tài liệu khác nhau.", "Giúp định dạng văn bản đẹp hơn.", "Giúp chèn hình ảnh vào trang.", "Giúp thay đổi màu nền của web."], 0),
    ('Để hiển thị một chú thích nhỏ khi di chuột qua liên kết, ta sử dụng thuộc tính nào trong thẻ "a"?', ["title", "tooltip", "hover", "alt"], 0),
    # Phần 2
    ("Thẻ nào được sử dụng để chèn ảnh vào trang web?", ["Thẻ img", "Thẻ picture", "Thẻ photo", "Thẻ image"], 0),
    ('Thuộc tính nào của thẻ "img" là bắt buộc?', ["alt", "src", "width", "height"], 1),
    ("Để thiết lập kích thước cho ảnh trong HTML, bạn nên sử dụng thuộc tính nào?", ["size", "dimension", "width và height", "scale"], 2),
    ("Thẻ nào được sử dụng để chèn video vào trang web?", ["Thẻ audio", "Thẻ media", "Thẻ video", "Thẻ movie"], 2),
    ('Thuộc tính nào không có trong thẻ "audio"?', ["controls", "autoplay", "poster", "src"], 2),
    ("Thẻ nào được sử dụng để chèn âm thanh vào trang web?", ["Thẻ music", "Thẻ audio", "Thẻ sound", "Thẻ track"], 1),
    ("Khi chèn khung nội tuyến vào trang web, bạn nên sử dụng thẻ nào?", ["Thẻ iframe", "Thẻ frame", "Thẻ embed", "Thẻ object"], 0),
    ('Thuộc tính nào của thẻ "iframe" không đúng?', ["src", "width", "height", "alt"], 3),
    ('Để video tự động phát khi trang web được mở, bạn cần sử dụng thuộc tính nào trong thẻ "video"?', ["controls", "poster", "autoplay", "loop"], 2),
    ('Khi chèn liên kết đến trang web khác vào khung nội tuyến bằng thẻ "iframe", thuộc tính nào xác định nội dung hiển thị?', ["src", "link", "ref", "url"], 0),
    ('Thẻ "video" chỉ hỗ trợ hiển thị video mà không thể phát âm thanh là đúng hay sai?', ["Đúng", "Sai"], 1),
    ('Thẻ "iframe" có thể được dùng để nhúng một trang web khác vào trang hiện tại là đúng hay sai?', ["Đúng", "Sai"], 0),
    ('Thuộc tính alt trong thẻ "img" là bắt buộc và không thể bỏ qua là đúng hay sai?', ["Đúng", "Sai"], 1),
    ("Thẻ nào không hỗ trợ thuộc tính width và height?", ["Thẻ video", "Thẻ audio", "Thẻ img", "Thẻ iframe"], 1),
    ("Để một đoạn video tự động lặp lại từ đầu khi kết thúc, ta dùng thuộc tính nào?", ["autoplay", "loop", "repeat", "rewind"], 1),
    ('Nội dung văn bản được đặt giữa thẻ mở và thẻ đóng của thẻ "video" sẽ hiển thị khi nào?', ["Luôn luôn hiển thị bên dưới video", "Chỉ hiển thị khi video đang phát", "Hiển thị khi trình duyệt không hỗ trợ thẻ video", "Không bao giờ hiển thị"], 2),
    ("Ảnh có định dạng nào sau đây hỗ trợ nền trong suốt?", ["JPG", "PNG", "BMP", "PDF"], 1),
    ('Thuộc tính "controls" trong thẻ audio có tác dụng gì?', ["Tự động phát âm thanh", "Hiển thị thanh điều khiển phát, tạm dừng, âm lượng", "Giấu tệp âm thanh khỏi trang web", "Tự động lặp lại âm thanh"], 1),
    ('Đường dẫn src="images/logo.png" là loại đường dẫn nào?', ["Đường dẫn tuyệt đối", "Đường dẫn tương đối", "Đường dẫn ảo", "Đường dẫn gốc"], 1),
    ('Để đặt hình ảnh đại diện hiển thị trước khi video bắt đầu phát, ta dùng thuộc tính nào của thẻ "video"?', ["cover", "thumbnail", "poster", "preview"], 2),
    # Phần 3 (30 câu)
    ("Thẻ nào được sử dụng để tạo biểu mẫu trên web?", ["Thẻ input", "Thẻ label", "Thẻ form", "Thẻ select"], 2),
    ('Thuộc tính nào của thẻ "input" được sử dụng để xác định loại dữ liệu?', ["id", "name", "type", "value"], 2),
    ("Thẻ nào được sử dụng để nhóm các phần tử có liên quan trong biểu mẫu?", ["Thẻ fieldset", "Thẻ legend", "Thẻ label", "Thẻ select"], 0),
    ('Thẻ "label" thường được sử dụng để?', ["Nhập dữ liệu.", "Nhóm phần tử.", "Định nghĩa nhãn cho phần tử input.", "Hiển thị các lựa chọn."], 2),
    ("Để tạo một danh sách thả xuống, thẻ nào được sử dụng?", ["Thẻ input", "Thẻ label", "Thẻ select", "Thẻ textarea"], 2),
    ('Khi sử dụng thẻ "input" với type="radio", mục đích là để?', ["Cho phép chọn nhiều tùy chọn.", "Cho phép chọn một tùy chọn duy nhất trong nhóm.", "Nhập dữ liệu dạng chữ.", "Nhập dữ liệu dạng số."], 1),
    ('Để tạo trường nhập dữ liệu cho số, thẻ "input" nên sử dụng thuộc tính nào?', ['type="text"', 'type="number"', 'type="date"', 'type="checkbox"'], 1),
    ('Thuộc tính nào của thẻ "input" không phải là thuộc tính chính để xác định dữ liệu nhập vào?', ["id", "name", "type", "value"], 0),
    ('Để tạo nút gửi thông tin trong biểu mẫu, thẻ "input" nên sử dụng thuộc tính nào?', ['type="text"', 'type="submit"', 'type="button"', 'type="reset"'], 1),
    ('Thẻ "form" bắt buộc phải có thuộc tính action là đúng hay sai?', ["Đúng", "Sai"], 1),
    ('Thẻ "input" với type="text" cho phép nhập văn bản một dòng là đúng hay sai?', ["Đúng", "Sai"], 0),
    ('Thuộc tính method="get" gửi dữ liệu qua URL, phù hợp cho biểu mẫu tìm kiếm là đúng hay sai?', ["Đúng", "Sai"], 0),
    ('Thẻ "textarea" chỉ cho phép nhập tối đa 50 ký tự là đúng hay sai?', ["Đúng", "Sai"], 1),
    ("Để tạo ô checkbox, thẻ input cần có thuộc tính nào?", ['type="radio"', 'type="checkbox"', 'type="select"', 'type="multi"'], 1),
    ('Thuộc tính nào tạo chuỗi văn bản gợi ý bên trong ô nhập liệu?', ["value", "hint", "placeholder", "suggest"], 2),
    ('Để tạo trường nhập mật khẩu, thẻ "input" dùng thuộc tính nào?', ['type="hidden"', 'type="password"', 'type="text"', 'type="secret"'], 1),
    ('Nút xóa trắng dữ liệu trong form sử dụng thẻ "input" với thuộc tính nào?', ['type="clear"', 'type="delete"', 'type="reset"', 'type="remove"'], 2),
    ("Lựa chọn trong danh sách thả xuống (thẻ select) được tạo bằng thẻ nào?", ["Thẻ item", "Thẻ list", "Thẻ choice", "Thẻ option"], 3),
    ("Thuộc tính nào bắt buộc người dùng phải điền vào ô nhập trước khi gửi?", ["required", "readonly", "disabled", "mandatory"], 0),
    ('Dữ liệu gửi bằng phương thức "post" sẽ như thế nào?', ["Hiển thị công khai trên URL", "Được ẩn khỏi URL, bảo mật hơn get", "Chỉ chứa văn bản thuần túy", "Bị giới hạn ở 255 ký tự"], 1),
    ('Thẻ "textarea" khác thẻ "input type=text" ở điểm nào?', ["textarea chỉ nhập được số.", "textarea cho phép nhập văn bản nhiều dòng.", "textarea không thể đặt trong form.", "textarea không hỗ trợ thuộc tính name."], 1),
    ('Thuộc tính "rows" và "cols" của thẻ "textarea" dùng để làm gì?', ["Xác định màu nền.", "Xác định số dòng và số cột hiển thị.", "Xác định số ký tự tối đa.", "Xác định vị trí trên trang."], 1),
    ("Để các nút radio thuộc cùng một nhóm, chúng phải có cùng giá trị của thuộc tính nào?", ["id", "value", "name", "type"], 2),
    ('Thẻ "legend" trong biểu mẫu dùng để làm gì?', ["Tạo nhãn cho ô nhập.", "Tạo tiêu đề cho nhóm phần tử (fieldset).", "Tạo nút bấm.", "Tạo danh sách thả xuống."], 1),
    ('Thuộc tính "action" trong thẻ "form" có chức năng gì?', ["Xác định phương thức gửi.", "Xác định URL nơi dữ liệu được gửi đến.", "Xác định kiểu dữ liệu.", "Xác định tên biểu mẫu."], 1),
    ('Thuộc tính "method" trong thẻ "form" có thể nhận giá trị nào?', ["send và receive", "upload và download", "get và post", "input và output"], 2),
    ('Thẻ "input" với type="email" có tác dụng gì?', ["Tự động gửi email.", "Tạo ô nhập có kiểm tra định dạng email.", "Hiển thị danh sách email.", "Ẩn địa chỉ email."], 1),
    ('Thuộc tính "disabled" trên thẻ "input" có tác dụng gì?', ["Xóa ô nhập khỏi trang.", "Vô hiệu hóa ô nhập, người dùng không tương tác được.", "Ẩn ô nhập.", "Bắt buộc nhập."], 1),
    ('Thẻ "button" và thẻ "input type=submit" khác nhau ở điểm nào?', ["Không khác biệt.", "Thẻ button có thể chứa nội dung HTML bên trong.", "Thẻ button không thể gửi form.", "Thẻ input submit chứa được hình ảnh bên trong."], 1),
    ('Thuộc tính "for" trong thẻ "label" có chức năng gì?', ["Liên kết nhãn với phần tử input qua giá trị id.", "Định dạng nhãn.", "Xác định vị trí nhãn.", "Tạo liên kết đến trang khác."], 0),
    # Phần 4 (20 câu)
    ("CSS viết tắt của từ nào trong tiếng Anh?", ["Cascading Style Sheets.", "Cascading Script Sheets.", "Color Style Sheets.", "Cascading Style Systems."], 0),
    ("Trong cấu trúc CSS, phần nào xác định thẻ HTML nào sẽ được áp dụng định dạng?", ["Vùng mô tả.", "Thuộc tính.", "Bộ chọn.", "Giá trị."], 2),
    ("Đoạn mã nào là ví dụ CSS với nhiều quy định trong vùng mô tả?", ["h1 {color: red;}", "p {text-indent: 15px; color: blue;}", "div {background: yellow;}", "a {font-size: 14px;}"], 1),
    ("Cách nào không phải là một cách thiết lập CSS?", ["CSS trong.", "CSS ngoài.", "CSS nội tuyến.", "CSS tích hợp."], 3),
    ("Để kết nối tệp CSS với HTML, dùng thẻ nào trong phần head?", ["Thẻ script.", "Thẻ style.", "Thẻ link.", "Thẻ import."], 2),
    ("Cấu trúc mẫu định dạng CSS đơn giản nhất bao gồm?", ["Chỉ bộ chọn.", "Chỉ vùng mô tả.", "Bộ chọn và vùng mô tả.", "Bộ chọn, vùng mô tả và thuộc tính."], 2),
    ("Cách nào cho phép định dạng CSS trực tiếp trong phần tử HTML?", ["CSS trong.", "CSS ngoài.", "CSS nội tuyến.", "CSS liên kết."], 2),
    ("Để định dạng tất cả thẻ h1, h2, h3 cùng lúc, viết CSS thế nào?", ["h1 h2 h3 {color: red;}", "h1, h2, h3 {color: red;}", "h1 h2, h3 {color: red;}", "h1, h2, h3 {color red}"], 1),
    ("Mẫu nào dưới đây là CSS nội tuyến?", ["<style> p {color: green;} </style>", '<link rel="stylesheet" href="styles.css">', '<p style="color: green;">Text</p>', "h1 {color: green;}"], 2),
    ("Tại sao CSS có lợi hơn định dạng HTML trực tiếp?", ["CSS không cần viết mã.", "CSS giúp tách nội dung và định dạng, tăng tính đồng nhất.", "CSS làm trang web không cần định dạng.", "CSS không hỗ trợ đa dạng kiểu."], 1),
    ("Tính kế thừa trong CSS có nghĩa là gì?", ["Thuộc tính chỉ áp dụng cho phần tử cụ thể.", "Thuộc tính CSS phần tử cha cũng áp dụng cho phần tử con, cháu.", "CSS chỉ áp dụng cho phần tử cuối.", "Không có kế thừa trong CSS."], 1),
    ("Thuộc tính nào ưu tiên cao nhất khi dùng !important?", ["color.", "font-size.", "margin.", "Tất cả các thuộc tính với !important."], 3),
    ("Bộ chọn CSS nào áp dụng cho phần tử p là con trực tiếp của div?", ["div p", "div > p", "div + p", "div ~ p"], 1),
    ("Để áp dụng màu cho tất cả phần tử HTML, dùng bộ chọn CSS nào?", ["body", "Ký tự *", "html", "all"], 1),
    ("Để định dạng nhóm phần tử có cùng ý nghĩa, dùng bộ chọn nào?", ["ID", "Class", "Inline", "Block"], 1),
    ("Mỗi phần tử HTML có thể có bao nhiêu ID?", ["Nhiều ID.", "Một ID.", "Không có ID.", "Tùy thuộc vào phần tử."], 1),
    ("Khi đặt tên ID và class, điều nào không đúng?", ["Phân biệt chữ hoa/thường.", "Tên bắt đầu bằng số.", "Không chứa dấu cách.", "Có ít nhất một ký tự không phải số."], 1),
    ("Bộ chọn CSS với ID được viết như thế nào?", [".idname {thuộc tính: giá trị;}", "#idname {thuộc tính: giá trị;}", "id idname {thuộc tính: giá trị;}", ".id {thuộc tính: giá trị;}"], 1),
    ("Phần tử có thể thuộc nhiều class bằng cách nào?", ["Dùng dấu phẩy.", "Dùng dấu chấm.", "Đặt các tên class cách nhau bởi dấu cách.", "Không thể có nhiều class."], 2),
    ("Khai báo nào đúng cấu trúc lệnh CSS?", ["{color: blue;} h1", "h1 {color: blue;}", "h1: color=blue;", "h1 (color: blue;)"], 1),
    # Phần 5 (30 câu)
    ("CSS có thể định dạng phông chữ qua thuộc tính nào?", ["font-family.", "font-size.", "font-weight.", "Tất cả các lựa chọn còn lại đều đúng."], 3),
    ("Định dạng nào thiết lập màu chữ trong CSS?", ["color.", "font-color.", "text-color.", "background-color."], 0),
    ("Trong CSS, thuộc tính line-height dùng để?", ["Định nghĩa chiều cao phần tử.", "Thiết lập khoảng cách giữa các dòng.", "Định nghĩa độ rộng chữ.", "Khoảng cách giữa các ký tự."], 1),
    ("Để căn lề dòng đầu đoạn văn bản, dùng thuộc tính nào?", ["text-align.", "margin.", "text-indent.", "padding."], 2),
    ("Thuộc tính text-align: center; dùng để?", ["Căn lề trái.", "Căn lề phải.", "Căn giữa văn bản.", "Căn đều hai bên."], 2),
    ("Phần tử inline trong HTML có đặc điểm gì?", ["Luôn bắt đầu dòng mới.", "Chiếm toàn bộ chiều rộng.", "Chỉ chiếm đúng phần không gian cần thiết, không xuống dòng.", "Không chứa văn bản."], 2),
    ("Bộ chọn phần tử (element selector) trong CSS viết thế nào?", ["#ten {thuộc tính: giá trị;}", ".ten {thuộc tính: giá trị;}", "ten {thuộc tính: giá trị;}", "*ten {thuộc tính: giá trị;}"], 2),
    ("Bộ chọn lớp (class selector) dùng ký hiệu nào đứng trước tên lớp?", ["Ký hiệu #", "Ký hiệu .", "Ký hiệu *", "Ký hiệu @"], 1),
    ("Thuộc tính CSS nào thay đổi kiểu viền (nét đứt, liền, chấm)?", ["border-width.", "border-color.", "border-style.", "border-radius."], 2),
    ("Thuộc tính background-color dùng để làm gì?", ["Định dạng màu viền.", "Định dạng màu nền.", "Định dạng màu chữ.", "Định dạng cỡ chữ."], 1),
    ("Phần tử khối (block) trong HTML có đặc điểm gì?", ["Luôn nằm trong phần tử khác.", "Không có chiều rộng cố định.", "Bắt đầu từ đầu hàng, kéo dài suốt chiều rộng trang.", "Luôn là inline."], 2),
    ("Để chuyển phần tử block thành inline, dùng thuộc tính CSS nào?", ["display: block;", "display: inline;", "display: flex;", "display: hidden;"], 1),
    ("border-style có thể nhận giá trị solid tạo viền liền nét — đúng hay sai?", ["Đúng", "Sai"], 0),
    ("border có thể kết hợp độ dày, kiểu viền và màu trong một dòng — đúng hay sai?", ["Đúng", "Sai"], 0),
    ("Trong HTML, phần tử bảng được tạo bằng thẻ nào?", ["Thẻ div", "Thẻ p", "Thẻ table", "Thẻ span"], 2),
    ("Để định dạng ô tiêu đề trong bảng, dùng thẻ nào?", ["Thẻ td", "Thẻ th", "Thẻ tr", "Thẻ caption"], 1),
    ("Trong Box Model, thuộc tính nào tạo khoảng cách lề bên ngoài?", ["padding", "margin", "border", "outline"], 1),
    ("Trong Box Model, thuộc tính nào tạo khoảng đệm bên trong?", ["padding", "margin", "border", "offset"], 0),
    ("Thẻ nào thường dùng để nhóm phần tử thành một khối trong bố cục trang web?", ["Thẻ span", "Thẻ div", "Thẻ p", "Thẻ a"], 1),
    ("background-color có thể nhận giá trị transparent — đúng hay sai?", ["Đúng", "Sai"], 0),
    ("Thẻ nào là phần tử inline trong HTML?", ["Thẻ div", "Thẻ p", "Thẻ span", "Thẻ h1"], 2),
    ("Thuộc tính display: block; có tác dụng gì?", ["Ẩn phần tử.", "Chuyển phần tử thành block, chiếm toàn bộ chiều rộng.", "Hiển thị như inline.", "Xóa phần tử."], 1),
    ("Thuộc tính CSS nào thiết lập chiều rộng phần tử?", ["height", "size", "width", "length"], 2),
    ("Trong Box Model, thứ tự từ trong ra ngoài là gì?", ["margin → border → padding → content", "content → padding → border → margin", "border → margin → content → padding", "padding → content → border → margin"], 1),
    ("Thuộc tính font-weight: bold; dùng để?", ["In nghiêng.", "In đậm văn bản.", "Gạch chân.", "Thay đổi cỡ chữ."], 1),
    ("Thuộc tính font-style: italic; dùng để?", ["In đậm.", "Gạch chân.", "In nghiêng văn bản.", "Thay đổi phông chữ."], 2),
    ("Thuộc tính text-decoration: underline; dùng để?", ["In đậm.", "Gạch chân văn bản.", "Xóa gạch chân.", "In nghiêng."], 1),
    ("Thuộc tính CSS nào thiết lập chiều cao phần tử?", ["width", "size", "height", "top"], 2),
    ("Thẻ nào sau đây là phần tử block trong HTML?", ["Thẻ span", "Thẻ a", "Thẻ strong", "Thẻ div"], 3),
    ("display: none khác visibility: hidden ở điểm nào?", ["Không khác biệt.", "display: none xóa khỏi luồng trang (không chiếm chỗ), visibility: hidden ẩn nhưng vẫn chiếm chỗ.", "display: none chỉ ẩn nhưng vẫn chiếm chỗ.", "Cả hai xóa phần tử."], 1),
]

# Answers lookup
answers_map = {0:'A', 1:'B', 2:'C', 3:'D'}

# Find DejaVu font
font_dir = os.path.expanduser("~/.gemini/antigravity/brain/")
# Try to find a Unicode font
import subprocess
result = subprocess.run(['find', '/usr', '-name', 'DejaVuSans.ttf', '-type', 'f'], capture_output=True, text=True)
dejavu = result.stdout.strip().split('\n')[0] if result.stdout.strip() else None

if not dejavu:
    result = subprocess.run(['find', '/System/Library', '-name', 'Arial Unicode.ttf', '-type', 'f'], capture_output=True, text=True)
    dejavu = result.stdout.strip().split('\n')[0] if result.stdout.strip() else None

# Download DejaVu if not found
if not dejavu:
    import urllib.request
    font_path = "/Users/minhngoc/HCMUE/MINDA/DejaVuSans.ttf"
    bold_path = "/Users/minhngoc/HCMUE/MINDA/DejaVuSans-Bold.ttf"
    if not os.path.exists(font_path):
        urllib.request.urlretrieve("https://github.com/dejavu-fonts/dejavu-fonts/raw/master/ttf/DejaVuSans.ttf", font_path)
    if not os.path.exists(bold_path):
        urllib.request.urlretrieve("https://github.com/dejavu-fonts/dejavu-fonts/raw/master/ttf/DejaVuSans-Bold.ttf", bold_path)
    dejavu = font_path
    dejavu_bold = bold_path
else:
    dejavu_bold = dejavu.replace('.ttf', '-Bold.ttf')
    if not os.path.exists(dejavu_bold):
        dejavu_bold = dejavu

print(f"Using font: {dejavu}")

pdf = QuizPDF('P', 'mm', 'A4')
pdf.alias_nb_pages()
pdf.add_font('DejaVu', '', dejavu)
pdf.add_font('DejaVu', 'B', dejavu_bold)
pdf.add_font('DejaVu', 'I', dejavu)

# Title page
pdf.add_page()
pdf.ln(40)
pdf.set_font('DejaVu', 'B', 26)
pdf.set_text_color(50, 50, 120)
pdf.multi_cell(0, 14, 'ĐỀ TRẮC NGHIỆM\nÔN TẬP HTML VÀ CSS', align='C')
pdf.ln(8)
pdf.set_font('DejaVu', 'B', 48)
pdf.set_text_color(80, 80, 200)
pdf.cell(0, 20, '120 CÂU', align='C')
pdf.ln(25)
pdf.set_font('DejaVu', '', 12)
pdf.set_text_color(100, 100, 100)
pdf.multi_cell(0, 8, 'Phần 1: Khái niệm cơ bản và Liên kết (Câu 1 – 20)\nPhần 2: Hình ảnh và Đa phương tiện (Câu 21 – 40)\nPhần 3: Biểu mẫu – Form (Câu 41 – 70)\nPhần 4: CSS Căn bản và Bộ chọn (Câu 71 – 90)\nPhần 5: Thuộc tính CSS, Bố cục & Display (Câu 91 – 120)', align='C')

# Questions
for sec_title, sec_start, sec_count in sections:
    pdf.add_page()
    pdf.set_font('DejaVu', 'B', 14)
    pdf.set_text_color(50, 50, 150)
    pdf.cell(0, 10, sec_title, ln=True)
    pdf.set_draw_color(80, 80, 200)
    pdf.line(10, pdf.get_y(), 200, pdf.get_y())
    pdf.ln(5)

    for i in range(sec_start, sec_start + sec_count):
        q_text, opts, ans = questions[i]
        
        # Check space
        if pdf.get_y() > 250:
            pdf.add_page()

        # Question
        pdf.set_font('DejaVu', 'B', 10)
        pdf.set_text_color(30, 30, 30)
        pdf.multi_cell(0, 6, f'Câu {i+1}. {q_text}')
        
        # Options
        pdf.set_font('DejaVu', '', 10)
        pdf.set_text_color(50, 50, 50)
        for j, opt in enumerate(opts):
            letter = chr(65 + j)
            x_before = pdf.get_x()
            pdf.set_x(18)
            pdf.multi_cell(0, 6, f'{letter}. {opt}')
            pdf.set_x(x_before)
        
        pdf.ln(3)

# Answer key
pdf.add_page()
pdf.set_font('DejaVu', 'B', 16)
pdf.set_text_color(50, 50, 150)
pdf.cell(0, 12, 'ĐÁP ÁN THAM KHẢO', align='C', ln=True)
pdf.ln(5)

for sec_title, sec_start, sec_count in sections:
    pdf.set_font('DejaVu', 'B', 10)
    pdf.set_text_color(50, 50, 120)
    pdf.cell(0, 8, sec_title, ln=True)
    
    pdf.set_font('DejaVu', '', 10)
    pdf.set_text_color(30, 30, 30)
    
    ans_line = ""
    for i in range(sec_start, sec_start + sec_count):
        _, _, ans = questions[i]
        ans_line += f'{i+1}{answers_map[ans]}, '
    
    pdf.multi_cell(0, 6, ans_line.rstrip(', ') + '.')
    pdf.ln(3)

out = '/Users/minhngoc/HCMUE/MINDA/De-trac-nghiem-HTML-CSS-120-cau.pdf'
pdf.output(out)
print(f"PDF saved: {out}")
