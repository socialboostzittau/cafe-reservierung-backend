import nodemailer from "nodemailer";

export default async function handler(req, res) {
  // CORS erlauben
  res.setHeader("Access-Control-Allow-Origin", "https://cafe-example-zittau.neocities.org");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  // Preflight Request sofort beantworten
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ message: "Only POST allowed" });
  }

  const { name, email, datum, uhrzeit, personen } = req.body;

  try {
    // Mail config
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASS,
      },
    });

    // Mail an Café
    await transporter.sendMail({
      from: process.env.MAIL_USER,
      to: process.env.MAIL_USER,
      subject: `Neue Reservierung von ${name}`,
      text: `
Neue Reservierung:

Name: ${name}
E-Mail: ${email}
Datum: ${datum}
Uhrzeit: ${uhrzeit}
Personen: ${personen}
      `,
    });

    res.status(200).json({ message: "Reservierung erfolgreich gesendet!" });
  } catch (err) {
    console.error("MAIL ERROR", err);
    res.status(500).json({ message: "Fehler beim Senden der Reservierung" });
  }
}
