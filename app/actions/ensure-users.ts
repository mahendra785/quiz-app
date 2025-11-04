"use server";

import { unstable_noStore as noStore } from "next/cache";
import { getDynamo } from "@/lib/dynamo";
import { GetCommand, PutCommand } from "@aws-sdk/lib-dynamodb";

const TABLE = process.env.DYNAMO_TABLE_NAME!;
const PK = "cloud";
const userPk = (email: string) => `USER#${email}`;

type EnsureUserInput = {
  email: string;
  name?: string;
  image?: string;
  defaultRole?: string;
};

export async function ensureUserAction({
  email,
  name,
  image,
  defaultRole = "admin",
}: EnsureUserInput) {
  noStore();
  if (!email) throw new Error("Email is required");

  const ddb = getDynamo();

  // Step 1: Check if user exists
  const existing = await ddb.send(
    new GetCommand({
      TableName: TABLE,
      Key: { [PK]: userPk(email) },
    })
  );

  if (existing.Item) {
    return existing.Item; // Return existing user
  }

  // Step 2: Insert new user
  const newUser = {
    cloud: userPk(email),
    kind: "USER",
    email,
    name: name || undefined,
    image: image || undefined,
    role: defaultRole,
    createdAt: Date.now(),
  };

  await ddb.send(
    new PutCommand({
      TableName: TABLE,
      Item: newUser,
    })
  );

  return newUser;
}
