import multer, { diskStorage } from "multer";

// Multer config
export default multer({
  storage: diskStorage({}),
  fileFilter: (req, file, cb) => {
    let ext = file.originalname.slice(file.originalname.lastIndexOf('.'));
    if (ext !== ".jpg" && ext !== ".jpeg" && ext !== ".png" && ext !== ".webp" && ext !== ".pdf") {
      cb(new Error("File type is not supported. Only (.jpg .jpeg .png .webp .pdf) is allowed."), false);
      return;
    }
    cb(null, true);
  },
}).array('images', 5);