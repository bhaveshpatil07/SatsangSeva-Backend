import multer, { diskStorage } from "multer";
import { extname } from "path";

// Multer config
export default multer({
  storage: diskStorage({}),
  fileFilter: (req, file, cb) => {
    let ext = file.originalname.slice(file.originalname.lastIndexOf('.'));
    if (ext !== ".jpg" && ext !== ".jpeg" && ext !== ".png" && ext !== ".webp") {
      cb(new Error("File type is not supported. Only (.jpg .jpeg .png .webp) is allowed."), false);
      return;
    }
    cb(null, true);
  },
}).single('eventPoster');