import {
  uploadBuffer,
  uploadFromUrl,
  deleteImage,
} from "../services/cloudinaryService.js";

export const UploadController = {
  async upload(req, res) {
    try {
      if (!req.file)
        return res.status(400).json({ message: "No file uploaded" });

      const result = await uploadBuffer(req.file.buffer, req.file.originalname);
      return res.status(201).json({
        secure_url: result.secure_url,
        public_id: result.public_id,
        width: result.width,
        height: result.height,
        format: result.format,
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Upload failed" });
    }
  },

  async uploadByUrl(req, res) {
    try {
      const { imageUrl } = req.body || {};
      if (!imageUrl)
        return res.status(400).json({ message: "imageUrl is required" });

      const result = await uploadFromUrl(imageUrl);
      return res.status(201).json({
        secure_url: result.secure_url,
        public_id: result.public_id,
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Upload by URL failed" });
    }
  },

  async remove(req, res) {
    try {
      const { publicId } = req.params;
      if (!publicId)
        return res.status(400).json({ message: "publicId is required" });

      const result = await deleteImage(publicId);
      return res.json(result);
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Delete failed" });
    }
  },
};
