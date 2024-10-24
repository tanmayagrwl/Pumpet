import argon2 from "argon2";
import db from "../db/db";
import { createOrgSchema, orgSchema, type OrgType } from "../types";
import { BackendError } from "../utils/errors";
import type { Context } from "hono";
import generateToken from "../utils/token";

export const handleOrgSignup = async (c: Context) => {
  const { name, email, password } = await c.req.json();

  console.log({ name, email, password });

  if (!name || !email || !password) {
    throw new BackendError("BAD_REQUEST", {
      message: "Invalid request body",
    });
  }

  const hash = await argon2.hash(password);
  console.trace();
  const orgData = await createOrgSchema.parseAsync({ name, email, hash });

  console.trace();
  const result = await (await db())
    .collection<OrgType>("orgs")
    .insertOne(orgData);
  console.trace();

  if (!result.insertedId) {
    throw new BackendError("INTERNAL_ERROR", {
      message: "Error creating organization",
    });
  }

  return c.json({
    success: true,
    message: "Organization created successfully",
  });
};

export const handleOrgLogin = async (c: Context) => {
  const { email, password } = await c.req.json();

  if (!email || !password) {
    throw new BackendError("BAD_REQUEST", {
      message: "Invalid request body",
    });
  }

  const org = await (await db()).collection<OrgType>("orgs").findOne({ email });

  if (!org) {
    throw new BackendError("USER_NOT_FOUND");
  }

  const valid = await argon2.verify(org.hash, password);

  if (!valid) {
    throw new BackendError("UNAUTHORIZED", {
      message: "Invalid password",
    });
  }

  const token = generateToken(email);

  return c.json({
    success: true,
    message: "Login successful",
    data: { token: token },
  });
};
