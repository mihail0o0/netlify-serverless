import fetch from "node-fetch";

console.log("MJAU");

export const handler = async () => {
  const API_KEY =
    "pathxuJGghrYvGJj4.61ae89c2cb92e985809f20fd96bd79d35b2b6590fb63f97059f04f4f6bd2fc03";
  const URL = "https://api.airtable.com/v0";

  const BASE_ID = "appEgHRWQsvF5F7pL";
  const TABLE_NAME = "tblChiOS40d8z752f";

  const getImages = `${URL}/${BASE_ID}/${TABLE_NAME}`;

  const response = await fetch(getImages, {
    headers: {
      Authorization: `Bearer ${API_KEY}`,
    },
  });
  const data = await response.json();

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

document.addEventListener("DOMContentLoaded", async () => {
  const fetchBtn = document.getElementById("fetch-btn");
  const responseText = document.getElementById("response-output");

  fetchBtn.addEventListener("click", async () => {
    const data = await handler();
    console.log(data);
  });
});
