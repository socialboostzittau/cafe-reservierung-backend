import { kv } from "@vercel/kv";

export default async function handler(req, res) {
  const adminKey = req.headers["x-admin-key"];

  if (adminKey !== process.env.ADMIN_KEY) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  if (req.method !== "GET") {
    return res.status(405).json({ message: "Only GET allowed" });
  }

  try {
    const ids = await kv.lrange("res:list", 0, -1);
    const reservations = [];

    for (const id of ids) {
      const data = await kv.hgetall(`res:${id}`);
      if (data && data.id) reservations.push(data);
    }

    return res.status(200).json({ reservations });
  } catch (err) {
    console.error("ADMIN LIST ERROR", err);
    return res.status(500).json({ message: "Fehler beim Laden der Reservierungen." });
  }
}
