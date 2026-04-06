const fs = require('fs');

const content = fs.readFileSync('/Users/minhngoc/HCMUE/MINDA/student-center/frontend/src/components/profile/TeacherCVView.tsx', 'utf8');

let count = 0;
const d = [];

const regex = /<\/?div/g;
let match;
while ((match = regex.exec(content)) !== null) {
    if (match[0] === '<div') {
        count++;
        d.push(match.index);
    } else if (match[0] === '</div') {
        count--;
        d.pop();
    }
}
console.log("Unbalanced divs count: ", count);
