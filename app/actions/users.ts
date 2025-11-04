"use server";

import { unstable_noStore as noStore, revalidatePath } from "next/cache";
import { getDynamo } from "@/lib/dynamo";
import { User, UserSchema } from "@/lib/interfaces";
import { GetCommand, PutCommand, UpdateCommand } from "@aws-sdk/lib-dynamodb";

const TABLE = process.env.DYNAMO_TABLE_NAME!;
const PK = "cloud";
const userPk = (email: string) => `USER#${email}`;

/** Get user by email (server action) */
export async function getUserByEmailAction(email: string): Promise<User | null> {
  noStore();
  const ddb = getDynamo();
  const res = await ddb.send(new GetCommand({
    TableName: TABLE,
    Key: { [PK]: userPk(email.trim()) },
  }));
  if (!res.Item) return null;
  return UserSchema.parse(res.Item);
}

/** Create (if not exists) or update lastLoginAt on sign-in. Returns the stored user. */
export async function ensureUserAction(input: {
  email: string;
  name?: string | null;
  image?: string | null;
  // Optional default role if this is a first-time user
  defaultRole?: User["role"];
}): Promise<User> {
  const email = String(input.email ?? "").trim().toLowerCase();
  if (!email) throw new Error("email required");

  const now = Date.now();
  const ddb = getDynamo();

  // 1) Try to create (idempotent): if exists, the conditional put fails silently and we proceed to update
  const newUser: User = {
    cloud: userPk(email),
    kind: "USER",
    email,
    role: "admin",
    name: input.name ?? null,
    image: input.image ?? null,
    createdAt: now,
    lastLoginAt: now,
  };
  // Validate *before* write
  UserSchema.parse(newUser);

  try {
    await ddb.send(new PutCommand({
      TableName: TABLE,
      Item: newUser,
      ConditionExpression: "attribute_not_exists(#pk)",
      ExpressionAttributeNames: { "#pk": PK },
    }));
    // Created new
    return newUser;
  } catch {
    // 2) Already exists → update lastLoginAt (and keep name/image if they were previously empty)
    await ddb.send(new UpdateCommand({
      TableName: TABLE,
      Key: { [PK]: userPk(email) },
      UpdateExpression: "SET #lla = :now, #nm = if_not_exists(#nm, :name), #img = if_not_exists(#img, :image)",
      ExpressionAttributeNames: { "#lla": "lastLoginAt", "#nm": "name", "#img": "image" },
      ExpressionAttributeValues: { ":now": now, ":name": input.name ?? null, ":image": input.image ?? null },
    }));
    const updated = await getUserByEmailAction(email);
    if (!updated) throw new Error("failed to upsert user");
    return updated;
  }
}

/** Admin-only: set role explicitly (server action) */
export async function setUserRoleAction(
  email: string,
  role: User["role"]
): Promise<{ ok: boolean; error?: string }> {
  const ddb = getDynamo();
  const keyEmail = email.trim().toLowerCase();

  try {
    await ddb.send(
      new UpdateCommand({
        TableName: TABLE,
        Key: { [PK]: userPk(keyEmail) },
        UpdateExpression: "SET #r = :r",
        ConditionExpression: "attribute_exists(#pk)", // only update if user exists
        ExpressionAttributeNames: { "#r": "role", "#pk": PK },
        ExpressionAttributeValues: { ":r": role },
      })
    );

    // revalidate any pages showing roles
    revalidatePath("/admin");
    return { ok: true };
  } catch (err: any) {
    // ConditionalCheckFailedException -> user does not exist
    if (err?.name === "ConditionalCheckFailedException") {
      return { ok: false, error: "user not found" };
    }
    throw err;
  }
}
