import nodemailer from "nodemailer";
import { kv } from "@vercel/kv";

export default async function handler(req, res) {
  // CORS erlauben
  res.setHeader("Access-Control-Allow-Origin", "https://cafe-example-zittau.neocities.org");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ message: "Only POST allowed" });
  }

  const { name, email, datum, uhrzeit, personen } = req.body;

  if (!name || !email || !datum || !uhrzeit || !personen) {
    return res.status(400).json({ message: "Bitte alle Felder ausfüllen." });
  }

  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASS,
      },
    });

    // 🔢 ID erzeugen
    const id = await kv.incr("res:counter");
    const resId = String(id);

    const createdAt = new Date().toISOString();

    // 💾 In Upstash speichern
    await kv.hset(`res:${resId}`, {
      id: resId,
      name,
      email,
      datum,
      uhrzeit,
      personen: String(personen),
      status: "neu",
      createdAt,
    });

    await kv.lpush("res:list", resId);

    // Mail an Café
    await transporter.sendMail({
      from: process.env.MAIL_USER,
      to: process.env.MAIL_USER,
      subject: `Neue Reservierung von ${name}`,
      text: `
Neue Reservierung:

ID: ${resId}
Name: ${name}
E-Mail: ${email}
Datum: ${datum}
Uhrzeit: ${uhrzeit}
Personen: ${personen}
      `,
    });

    // Eingangsbestätigung an Gast
    await transporter.sendMail({
      from: `Café Example Zittau <${process.env.MAIL_USER}>`,
      to: email,
      subject: "Deine Reservierungsanfrage ist eingegangen",
      text: `
Hallo ${name},

vielen Dank für deine Reservierungsanfrage im Café Example Zittau.

Wir haben deine Anfrage erhalten:

Datum: ${datum}
Uhrzeit: ${uhrzeit}
Personen: ${personen}

Dies ist noch KEINE Bestätigung.
Du erhältst eine weitere E-Mail, sobald wir die Reservierung geprüft haben.

Herzliche Grüße
Café Example Zittau
      `,
    });

    return res.status(200).json({
      message: "Reservierung eingegangen! Du erhältst eine Bestätigung per E-Mail.",
    });
  } catch (err) {
    console.error("MAIL / KV ERROR", err);
    return res.status(500).json({ message: "Fehler beim Absenden der Reservierung." });
  }
}
