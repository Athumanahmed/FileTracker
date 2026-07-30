import axios from "axios";

export const sendSMSNotification = async (phone, message) => {
  try {
    const apiURL = "https://apisms.beem.africa/v1/send";
    const apiKey = process.env.BEEM_AFRICA_API_KEY_SMS;
    const secretKey = process.env.BEEM_AFRICA_SECRET_KEY_SMS;
    const senderId = process.env.SENDER_ID;

    const { data } = await axios.post(
      apiURL,
      {
        source_addr: senderId,
        schedule_time: "",
        encoding: 0,
        message,
        recipients: [{ recipient_id: 1, dest_addr: phone }],
      },
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Basic ${Buffer.from(
            `${apiKey}:${secretKey}`,
          ).toString("base64")}`,
        },
      },
    );

    if (data.code === 100) {
      return data;
    } else {
      throw new Error(`SMS failed with code: ${data.code}`);
    }
  } catch (error) {
    const errorMsg =
      error?.response?.data?.message ||
      error?.response?.data ||
      error.message ||
      "Unknown error occurred while sending SMS.";

    // Optionally log the full error to debug
    console.error("Beem SMS Error:", error?.response?.data || error);

    throw new Error(errorMsg);
  }
};
