const multer = require('multer');
const path = require('path');
const fs = require('fs');

const uploadDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    let newName = file.originalname;
    let counter = 1;
    while (fs.existsSync(path.join(uploadDir, newName))) {
      const ext = path.extname(file.originalname);
      const base = path.basename(file.originalname, ext);
      newName = `${base} (${counter})${ext}`;
      counter++;
    }
    cb(null, newName);
  }
});

module.exports = multer({ storage });