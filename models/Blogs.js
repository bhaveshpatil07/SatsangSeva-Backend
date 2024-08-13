import mongoose from "mongoose";

const blogsSchema = new mongoose.Schema({
    title: {
        type: String,
        unique: true,
        required: true,
    },
    content: {
        type: String,
        required: true,
    },
    images: {
        type: [{ type: String }],
        required: true,
    }
});

export default mongoose.model("Blogs", blogsSchema);
