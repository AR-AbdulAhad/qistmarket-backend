const multer = require('multer');
const path = require('path');
const fs = require('fs');

const uploadDir = path.join(__dirname, '../uploads');

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const generateUniqueNumber = () => {
  return Math.floor(100000 + Math.random() * 9000000);
};

const getUniqueFilename = (originalExt) => {
  let filename;
  let fullPath;
  do {
    const num = generateUniqueNumber();
    filename = `${num}${originalExt}`;
    fullPath = path.join(uploadDir, filename);
  } while (fs.existsSync(fullPath));
  return filename;
};

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const uniqueName = getUniqueFilename(ext); 
    cb(null, uniqueName);
  },
});

const upload = multer({ storage });

module.exports = upload;