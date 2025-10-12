import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";

let _doc: DynamoDBDocumentClient | null = null;

export function getDynamo() {
  if (_doc) return _doc;
  const client = new DynamoDBClient({
    region: process.env.AWS_REGION,
  });
  _doc = DynamoDBDocumentClient.from(client);
  return _doc;
}
