import fetch from "node-fetch";
import jsPDF from "jspdf";
import FormData from "form-data";

import { createClient } from "@supabase/supabase-js";

// Initialize Supabase
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY); // server-side

async function urlToBase64(url) {
  const res = await fetch(url);
  const buffer = await res.arrayBuffer();
  return Buffer.from(buffer).toString("base64");
}

export const handler = async (event) => {
  if (event.httpMethod === "OPTIONS") {
    return {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "*",
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      },
      body: "OK",
    };
  }

  const fullUrl = `${process.env.AIRTABLE_URL}/${process.env.BASE_ID}/${process.env.PDFS_TABLE_NAME}`;

  try {
    const { images } = JSON.parse(event.body);

    if (!images || !Array.isArray(images) || images.length === 0) {
      throw new Error("No images provided or invalid images array");
    }

    const doc = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
    });

    for (let i = 0; i < images.length; i++) {
      const img = images[i];

      if (i > 0) {
        doc.addPage();
      }

      try {
        const base64Img = await urlToBase64(img);

        doc.addImage({
          imageData: `data:image/jpeg;base64,${base64Img}`,
          x: (210 - 150) / 2,
          y: (297 - 150) / 2,
          width: 150,
          height: 150,
        });
      } catch (imageError) {
        console.warn(`Failed to add image ${i + 1}:`, imageError.message);
        doc.text(`Failed to load image ${i + 1}`, 20, 20);
      }
    }

    const pdfBuffer = Buffer.from(doc.output("arraybuffer"));
    const pdfBase64 = pdfBuffer.toString("base64");
    const filename = `output-${Date.now()}.pdf`;

    // const formData = new FormData();
    // formData.append("file", pdfBuffer, {
    //   filename: "output.pdf",
    //   contentType: "application/pdf",
    // });

    const { resData, error } = await supabase.storage
      .from("pdfs")
      .upload(filename, pdfBuffer, {
        contentType: "application/pdf",
        upsert: true,
      });

    if (error) {
      console.log(error);
      return error;
    }

    const { data: publicUrl } = supabase.storage
      .from("pdfs")
      .getPublicUrl(filename);


    const airtableData = {
      records: [
        {
          fields: {
            Attachments: [
              {
                url: `${publicUrl.publicUrl}`,
                filename: "generated-document.pdf",
              },
            ],
          },
        },
      ],
    };

    const response = await fetch(fullUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.AIRTABLE_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(airtableData),
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
        "Access-Control-Allow-Headers": "*",
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
        "Access-Control-Allow-Headers": "*",
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ success: false, error: error.message }),
    };
  }
};
