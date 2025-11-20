import { kv } from "@vercel/kv";
import nodemailer from "nodemailer";

export default async function handler(req, res) {
  const adminKey = req.headers["x-admin-key"];

  if (adminKey !== process.env.ADMIN_KEY) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  if (req.method !== "POST") {
    return res.status(405).json({ message: "Only POST allowed" });
  }

  const { id, status } = req.body;

  if (!id || !status) {
    return res.status(400).json({ message: "Missing id or status." });
  }

  try {
    const reservation = await kv.hgetall(`res:${id}`);

    if (!reservation) {
      return res.status(404).json({ message: "Reservierung nicht gefunden." });
    }

    await kv.hset(`res:${id}`, { ...reservation, status });

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASS,
      },
    });

    let subject = "";
    let text = "";

    if (status === "bestaetigt") {
      subject = "Deine Reservierung – bestätigt";
      text = `
Hallo ${reservation.name},

deine Reservierung im Café Example Zittau wurde bestätigt:

Datum: ${reservation.datum}
Uhrzeit: ${reservation.uhrzeit}
Personen: ${reservation.personen}

Wir freuen uns auf dich!
      `;
    } else if (status === "abgelehnt") {
      subject = "Deine Reservierung – leider nicht möglich";
      text = `
Hallo ${reservation.name},

leider können wir deine Reservierung am
${reservation.datum} um ${reservation.uhrzeit}
für ${reservation.personen} Person/en nicht annehmen.

Wir schlagen dir gern einen neuen Termin vor!

Herzliche Grüße
Café Example Zittau
      `;
    } else {
      return res.status(400).json({ message: "Ungültiger Status." });
    }

    await transporter.sendMail({
      from: `Café Example Zittau <${process.env.MAIL_USER}>`,
      to: reservation.email,
      subject,
      text,
    });

    return res.status(200).json({ message: "Status aktualisiert & E-Mail gesendet." });
  } catch (err) {
    console.error("ADMIN UPDATE ERROR", err);
    return res.status(500).json({ message: "Fehler beim Aktualisieren." });
  }
}
