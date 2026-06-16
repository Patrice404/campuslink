import nodemailer, { Transporter } from 'nodemailer';

// Transporter créé une seule fois (réutilisé pour tous les envois).
let transporterPromise: Promise<Transporter> | null = null;

async function getTransporter(): Promise<Transporter> {
  if (transporterPromise) return transporterPromise;

  transporterPromise = (async () => {
    // Cas normal : identifiants Gmail présents dans le .env
    if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
      return nodemailer.createTransport({
        service: 'gmail',
        auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
      });
    }

    // Repli dev : aucun identifiant → compte de test Ethereal.
    // Aucun mail réel n'est envoyé, mais on obtient une URL d'aperçu dans les logs.
    const testAccount = await nodemailer.createTestAccount();
    console.warn('[mailer] EMAIL_USER/EMAIL_PASS absents → compte de test Ethereal utilisé (aucun mail réel)');
    return nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: { user: testAccount.user, pass: testAccount.pass },
    });
  })();

  return transporterPromise;
}

// Génère un code numérique à 6 chiffres.
export function genererCode(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}

// Envoie un email contenant un code (vérification ou réinitialisation).
export async function envoyerCode(
  to: string,
  sujet: string,
  intro: string,
  code: string
): Promise<void> {
  const transporter = await getTransporter();
  const from = process.env.EMAIL_FROM || process.env.EMAIL_USER || 'CampusLink <no-reply@campuslink.dev>';

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 480px; margin: auto;">
      <h2 style="color:#2563eb;">CampusLink</h2>
      <p>${intro}</p>
      <p style="font-size: 28px; font-weight: bold; letter-spacing: 4px; margin: 24px 0;">${code}</p>
      <p style="color:#666;">Ce code est valable 10 minutes. Si tu n'es pas à l'origine de cette demande, ignore cet email.</p>
    </div>
  `;

  const info = await transporter.sendMail({ from, to, subject: sujet, html });

  // En mode test Ethereal, on logge l'URL d'aperçu de l'email
  const apercu = nodemailer.getTestMessageUrl(info);
  if (apercu) console.log('[mailer] Aperçu email (Ethereal):', apercu);
}
