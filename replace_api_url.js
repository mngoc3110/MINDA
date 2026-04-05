const fs = require('fs');
const path = require('path');

const directoryPath = path.join(__dirname, 'student-center', 'frontend', 'src');

function walkDir(dir, callback) {
    fs.readdirSync(dir).forEach(f => {
        let dirPath = path.join(dir, f);
        let isDirectory = fs.statSync(dirPath).isDirectory();
        isDirectory ? walkDir(dirPath, callback) : callback(path.join(dir, f));
    });
}

const urlPattern = /"http:\/\/localhost:8000([^"]*)"/g;
const urlPattern2 = /'http:\/\/localhost:8000([^']*)'/g;
const urlPattern3 = /`http:\/\/localhost:8000([^`]*)`/g;

walkDir(directoryPath, function(filePath) {
    if (filePath.endsWith('.tsx') || filePath.endsWith('.ts')) {
        let content = fs.readFileSync(filePath, 'utf8');
        let newContent = content;

        // Xử lý "http://localhost:8000/api/..." -> `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/...`
        newContent = newContent.replace(urlPattern, (match, p1) => {
            return "`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}" + p1 + "`";
        });
        
        newContent = newContent.replace(urlPattern2, (match, p1) => {
            return "`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}" + p1 + "`";
        });

        // Xử lý dạng template string (backtick) có chứa nội suy từ trước, vd: `http://localhost:8000/api/${id}`
        // Ta sẽ match `http://localhost:8000...` và chuyển thành `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}...`
        newContent = newContent.replace(/http:\/\/localhost:8000/g, "${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}");

        if (content !== newContent) {
            fs.writeFileSync(filePath, newContent, 'utf8');
            console.log('Modified:', filePath);
        }
    }
});
