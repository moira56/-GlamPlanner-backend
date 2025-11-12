import {
  uploadBuffer,
  uploadFromUrl,
  deleteImage,
} from "../services/cloudinaryService.js";

const ALLOWED_TAGS = ["oci", "usne", "ten", "obrve", "alat", "setovi"];

function parseTags(raw) {
  if (!raw) return [];

  let src;
  if (Array.isArray(raw)) {
    src = raw;
  } else if (typeof raw === "string") {
    const s = raw.trim();
    try {
      const parsed = JSON.parse(s);
      src = Array.isArray(parsed) ? parsed : s.split(",");
    } catch {
      src = s.split(",");
    }
  } else {
    src = [];
  }

  return Array.from(
    new Set(
      src
        .map((t) => String(t).trim().toLowerCase())
        .filter((t) => ALLOWED_TAGS.includes(t))
    )
  );
}

function parseContext(raw) {
  if (!raw) return {};
  if (typeof raw === "string") {
    try {
      return JSON.parse(raw);
    } catch {
      return {};
    }
  }
  return raw && typeof raw === "object" ? raw : {};
}

export const UploadController = {
  async upload(req, res) {
    try {
      if (!req.file)
        return res.status(400).json({ message: "No file uploaded" });

      const tags = parseTags(req.body?.tags);
      const context = parseContext(req.body?.context);

      const result = await uploadBuffer(
        req.file.buffer,
        req.file.originalname,
        null,
        { tags, context }
      );

      return res.status(201).json({
        secure_url: result.secure_url,
        public_id: result.public_id,
        width: result.width,
        height: result.height,
        format: result.format,
        tags: result.tags || [],
        context: result.context?.custom || {},
      });
    } catch (err) {
      console.error("Upload error:", err);
      res.status(500).json({ message: "Upload failed" });
    }
  },

  async uploadByUrl(req, res) {
    try {
      const { imageUrl } = req.body || {};
      if (!imageUrl)
        return res.status(400).json({ message: "imageUrl is required" });

      const tags = parseTags(req.body?.tags);
      const context = parseContext(req.body?.context);

      const result = await uploadFromUrl(imageUrl, null, { tags, context });

      return res.status(201).json({
        secure_url: result.secure_url,
        public_id: result.public_id,
        tags: result.tags || [],
        context: result.context?.custom || {},
      });
    } catch (err) {
      console.error("Upload-by-url error:", err);
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
      console.error("Delete image error:", err);
      res.status(500).json({ message: "Delete failed" });
    }
  },
};
