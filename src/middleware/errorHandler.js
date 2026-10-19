export function errorHandler(err, req, res, next) {
  if (err.type === "entity.parse.failed") {
    return res.status(400).json({ error: "invalid JSON" });
  }
  if (err.type === "entity.too.large") {
    return res.status(413).json({ error: "request body too large" });
  }
  console.error(err);
  res.status(500).json({ error: "internal server error" });
}
