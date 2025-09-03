import fetch from "node-fetch";
import jsPDF from "jspdf"; 
import FormData from "form-data";

export const handler = async (event) => {
  if (event.httpMethod === "OPTIONS") {
    return {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Content-Type",
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

    
    const doc = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4"
    });

    // Process each image
    for (let i = 0; i < images.length; i++) {
      const img = images[i];
      
      // Add new page for each image (except the first one)
      if (i > 0) {
        doc.addPage();
      }

      try {
        // Add image to PDF (centered, 150mm width)
        doc.addImage({
          imageData: img,
          x: (210 - 150) / 2, // Center horizontally (A4 width: 210mm)
          y: (297 - 150) / 2, // Center vertically (A4 height: 297mm)
          width: 150,
          height: 150
        });
      } catch (imageError) {
        console.warn(`Failed to add image ${i + 1}:`, imageError.message);
        // Add error message instead
        doc.text(`Failed to load image ${i + 1}`, 20, 20);
      }
    }

    // Generate PDF as buffer
    const pdfBuffer = Buffer.from(doc.output('arraybuffer'));

    // Create form data for Airtable
    const form = new FormData();
    form.append("fields[GeneratedPDF]", pdfBuffer, {
      filename: "output.pdf",
      contentType: "application/pdf",
    });


    const formHeaders = form.getHeaders();

    const response = await fetch(fullUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${API_KEY}`,
        ...formHeaders,
      },
      body: form,
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
        "Access-Control-Allow-Headers": "Content-Type",
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
        "Access-Control-Allow-Headers": "Content-Type",
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ success: false, error: error.message }),
    };
  }
};