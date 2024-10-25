import * as JWT from "jsonwebtoken";
import ENV from "./env";

export default function generateToken(email: string): string {
	return JWT.sign({ email }, ENV.SECRET, {
		expiresIn: "30d",
	});
}

export function verifyToken(token: string) {
	const data = JWT.verify(token, ENV.SECRET) as string;

	return data as unknown as {
		email: string;
	};
}
