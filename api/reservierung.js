import nodemailer from "nodemailer";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Only POST allowed" });
  }

  const data = req.body || {};

  const {
    name,
    email,
    telefon,
    datum,
    uhrzeit,
    personen,
    nachricht
  } = data;

  if (!name || !email || !datum || !uhrzeit || !personen) {
    return res.status(400).json({ message: "Missing fields" });
  }

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.MAIL_USER,
      pass: process.env.MAIL_PASS
    }
  });

  // Mail an DICH (Café)
  await transporter.sendMail({
    from: `"Café Website" <${process.env.MAIL_USER}>`,
    to: process.env.MAIL_USER,
    subject: `Neue Tischreservierung von ${name}`,
    text: `
Neue Reservierungsanfrage über die Website:

Name: ${name}
E-Mail: ${email}
Telefon: ${telefon || "-"}

Datum: ${datum}
Uhrzeit: ${uhrzeit}
Personen: ${personen}

Nachricht:
${nachricht || "-"}
`
  });

  // Mail an den KUNDEN
  await transporter.sendMail({
    from: `"Café Example Zittau" <${process.env.MAIL_USER}>`,
    to: email,
    subject: "Wir haben deine Reservierung erhalten",
    text: `
Hallo ${name},

vielen Dank für deine Tischreservierung im Café Example Zittau.

Wir haben deine Anfrage erhalten und melden uns so schnell wie möglich, um sie zu bestätigen.

Viele Grüße  
Café Example Zittau
`
  });

  return res.status(200).json({ message: "OK" });
}
