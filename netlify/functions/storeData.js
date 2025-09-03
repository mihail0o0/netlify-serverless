import fetch from "node-fetch";
import PDFDocument from "pdfkit";
import FormData from "form-data";

export const handler = async (event) => {
  if (event.httpMethod === "OPTIONS") {
    return {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      },
      body: "OK",
    };
  }

  const API_KEY =
    "pathxuJGghrYvGJj4.61ae89c2cb92e985809f20fd96bd79d35b2b6590fb63f97059f04f4f6bd2fc03";
  const URL = "https://api.airtable.com/v0";

  const BASE_ID = "appEgHRWQsvF5F7pL";
  const TABLE_NAME = "tbl5cmdonx7I3JxZK";

  const fullUrl = `${URL}/${BASE_ID}/${TABLE_NAME}`;

  const { images } = JSON.parse(event.body);

  const doc = new PDFDocument({ autoFirstPage: false });
  const chunks = [];

  doc.on("data", (chunk) => chunks.push(chunk));
  doc.on("end", () => {});

  images.forEach((img) => {
    doc.addPage();
    doc.image(img, {
      fit: [400, 400],
      align: "center",
      valign: "center",
    });
  });
  doc.end();

  const pdfBuffer = await new Promise((resolve) => {
    doc.on("end", () => resolve(Buffer.concat(chunks)));
  });

  const form = new FormData();
  form.append("fields[GeneratedPDF]", pdfBuffer, { filename: "output.pdf" });

  const response = await fetch(fullUrl, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${API_KEY}`,
    },
    body: form,
  });
  const data = await response.json();

  return {
    statusCode: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ success: true, airtableResponse: data }),
  };
};
