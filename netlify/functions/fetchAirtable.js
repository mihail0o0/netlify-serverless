import fetch from "node-fetch";

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

  const getImages = `${process.env.AIRTABLE_URL}/${process.env.BASE_ID}/${process.env.IMAGES_TABLE_NAME}`;
  console.log(getImages);
  console.log(process.env.AIRTABLE_KEY);

  const response = await fetch(getImages, {
    headers: {
      Authorization: `Bearer ${process.env.AIRTABLE_KEY}`,
    },
  });
  const data = await response.json();

  console.log(data);

  return {
    statusCode: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "Content-Type",
    },
    body: JSON.stringify({
      data,
    }),
  };
};
