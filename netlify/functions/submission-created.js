// netlify/functions/submission-created.js
// Runs automatically for every Netlify form submission.

exports.handler = async (event) => {
  try {
    const wrapper = JSON.parse(event.body || "{}");
    const submission = wrapper.payload || {};
    const data = submission.data || {};
    const formName = (submission.form_name || "unknown-form").toLowerCase();
    const submittedAt = submission.created_at || new Date().toISOString();

    // Subject line varies per form
    let subject = "New Home Health Quiz Lead";
    if (formName.includes("hospice")) subject = "New Hospice/Palliative Quiz Lead";

    const lines = [
      subject,
      "",
      `Name:    ${data.name || ""}`,
      `Phone:   ${data.phone || ""}`,
      `Email:   ${data.email || ""}`,
      `ZIP:     ${data.zip || ""}`,
      `Insurance: ${data.payer || ""}`,
      `Best time: ${data.besttime || ""}`,
      "",
      `Form: ${formName}`,
      `Submitted at: ${submittedAt}`,
    ];
    const text = lines.join("\n");

    // Send via Resend
    const RESEND_API_KEY = process.env.RESEND_API_KEY;
    if (!RESEND_API_KEY) {
      console.error("Missing RESEND_API_KEY");
      return { statusCode: 500, body: "Missing RESEND_API_KEY" };
    }

    // For first tests, you can use "onboarding@resend.dev"
    const fromEmail = "onboarding@resend.dev"; // switch to onboarding@resend.dev if domain not yet verified
    const toEmail = "website-leads@safelifehomehealth.com";

    const resp = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: `Safe Life Quiz <${fromEmail}>`,
        to: [toEmail],
        subject,
        text,
        reply_to: data.email ? [{ email: data.email, name: data.name || "Quiz Lead" }] : undefined,
      }),
    });

    if (!resp.ok) {
      const t = await resp.text();
      console.error("Resend error:", t);
      return { statusCode: 502, body: `Email send failed: ${t}` };
    }

    return { statusCode: 200, body: "ok" };
  } catch (err) {
    console.error("submission-created error:", err);
    return { statusCode: 500, body: "Server error" };
  }
};
