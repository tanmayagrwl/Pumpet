import { Credentials, SESV2 } from "aws-sdk";
import type { SendEmailRequest } from "aws-sdk/clients/sesv2";
import ENV from "../utils/env";

const ses = new SESV2({
	apiVersion: "2019-09-27",
	region: "ap-south-1",
	credentials: new Credentials({
		accessKeyId: ENV.AWS_ACCESS_KEY_ID,
		secretAccessKey: ENV.AWS_ACCESS_KEY_SECRET,
	}),
});

export const sendEmail = (mail: SendEmailRequest) => {
	const request = ses.sendEmail(mail);
	return request.promise();
};

export const createSesMail = (
	html: string,
	text: string,
	subject: string,
	receiverEmail: string,
): SendEmailRequest => {
	const mail: SendEmailRequest = {
		Content: {
			Simple: {
				Body: {
					Html: {
						Data: html,
					},
					Text: {
						Data: text,
					},
				},
				Subject: {
					Data: subject,
				},
			},
		},
		Destination: {
			ToAddresses: [receiverEmail],
		},
		ReplyToAddresses: [ENV.AWS_ACCESS_SES_REPLY_EMAIL],
		FromEmailAddress: process.env.FROM_EMAIL,
	};
	return mail;
};
