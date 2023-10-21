import axios from "axios";

export const loadPdf = async (url: string) => {
  try {
    const response = await axios(url);
    const blob = await response;
  } catch (e) {
    console.log(e);
  }
};
