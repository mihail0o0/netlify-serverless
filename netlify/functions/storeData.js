import fetch from "node-fetch";
import PDFDocument from "pdfkit/js/pdfkit.standalone.js";
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

  try {
    const { images } = JSON.parse(event.body);
    
    if (!images || !Array.isArray(images) || images.length === 0) {
      throw new Error("No images provided or invalid images array");
    }

    const doc = new PDFDocument({ autoFirstPage: false });
    const chunks = [];

    doc.on("data", (chunk) => chunks.push(chunk));
    
    doc.font('Times-Roman');

    for (const img of images) {
      doc.addPage({
        size: [612, 792],
        margins: {
          top: 72,
          bottom: 72,
          left: 72,
          right: 72
        }
      });
      
      doc.image(img, {
        fit: [468, 468],
        align: "center",
        valign: "center"
      });
    }

    doc.end();

    const pdfBuffer = await new Promise((resolve, reject) => {
      doc.on("end", () => {
        resolve(Buffer.concat(chunks));
      });
      doc.on("error", reject);
    });

    const form = new FormData();
    form.append("fields[GeneratedPDF]", pdfBuffer, {
      filename: "output.pdf",
      contentType: "application/pdf"
    });

    const formHeaders = form.getHeaders();

    const response = await fetch(fullUrl, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${API_KEY}`,
        ...formHeaders
      },
      body: form
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Airtable API error: ${response.status} - ${errorText}`);
    }

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
  } catch (error) {
    console.error("Error:", error);
    
    return {
      statusCode: 400,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ success: false, error: error.message }),
    };
  }
};

};
