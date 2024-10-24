"use server";

import type { APIResponse } from "@/types/core";

export const sendEmail = async ({
  template,
  subject,
}: {
  template: string;
  subject: string;
}): Promise<APIResponse<string, string>> => {
  try {
    console.log(template);

    const result = await fetch(process.env.EMAIL_LAMBDA_ENDPOINT!, {
      method: "POST",
      body: JSON.stringify({
        template,
        subject,
      }),
      headers: {
        "Content-Type": "application/json",
      },
    });
    console.log(result);

    if (!result.ok) {
      console.log("Failed to send email");
      throw new Error("Failed to send email. Please try again later.");
    }

    return { success: true, data: "Email sent successfully" };
  } catch (error: unknown) {
    return { success: false, error: String(error) };
  }
};
