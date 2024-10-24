import { type Db, MongoClient } from "mongodb";
import config from "../utils/env";

let db: Db;

async function initializeClient(): Promise<Db> {
	const client = await MongoClient.connect(config.DATABASE_URI);

	return client.db();
}

export default async (): Promise<Db> => {
	if (!db) {
		db = await initializeClient();
	}
	return db;
};
