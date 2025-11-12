import { v2 as cloudinary } from "cloudinary";
import dotenv from "dotenv";
dotenv.config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const DEFAULT_FOLDER =
  (
    process.env.CLOUDINARY_GALLERY_FOLDER ||
    process.env.CLOUDINARY_FOLDER ||
    ""
  ).trim() || null;

export function uploadBuffer(
  buffer,
  filename,
  folder = DEFAULT_FOLDER,
  options = {}
) {
  const { tags = [], context = {} } = options;

  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        resource_type: "image",
        public_id: filename?.split(".")?.[0],
        ...(folder ? { folder } : {}),
        tags,
        context,
      },
      (err, result) => (err ? reject(err) : resolve(result))
    );
    stream.end(buffer);
  });
}

export async function uploadFromUrl(
  url,
  folder = DEFAULT_FOLDER,
  options = {}
) {
  const { tags = [], context = {} } = options;
  return cloudinary.uploader.upload(url, {
    resource_type: "image",
    ...(folder ? { folder } : {}),
    tags,
    context,
  });
}

export async function deleteImage(publicId) {
  return cloudinary.uploader.destroy(publicId, { resource_type: "image" });
}

export async function searchImages(params = {}) {
  const {
    folder = DEFAULT_FOLDER,
    tags = [],
    q = "",
    cursor,
    pageSize = 24,
  } = params;

  const parts = ["resource_type:image"];

  if (folder && folder !== "*" && folder.toLowerCase() !== "all") {
    parts.push(`folder=${folder}`);
  }

  if (tags.length) {
    const orTags = tags.map((t) => `tags=${t}`).join(" OR ");
    parts.push(`(${orTags})`);
  }

  if (q) {
    parts.push(`(context.brand=${q} OR context.shade=${q} OR public_id=${q})`);
  }

  const expression = parts.join(" AND ");
  console.log("[Cloudinary Search Expression]", expression);

  const search = cloudinary.search
    .expression(expression)
    .with_field("tags")
    .with_field("context")
    .sort_by("created_at", "desc")
    .max_results(pageSize);

  if (cursor) search.next_cursor(cursor);

  const result = await search.execute();

  return {
    items: result.resources.map((r) => ({
      id: r.public_id,
      url: r.secure_url,
      tags: r.tags,
      context: r.context?.custom || {},
      width: r.width,
      height: r.height,
      createdAt: r.created_at,
    })),
    nextCursor: result.next_cursor || null,
  };
}
