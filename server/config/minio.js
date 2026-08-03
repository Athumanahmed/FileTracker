import "dotenv/config";
import { Client } from "minio";
import { requiredEnv } from "../utils/env.js";

/**
 * Single MinIO client instance for the whole server. Every module that
 * needs storage goes through the Storage Module (storage/), never through
 * this client directly -- keeps the provider swappable (S3/Azure/GCS later)
 * behind one abstraction.
 */
const minioClient = new Client({
  endPoint: requiredEnv("MINIO_ENDPOINT"),
  port: Number(process.env.MINIO_PORT || 9000),
  useSSL: process.env.MINIO_USE_SSL === "true",
  accessKey: requiredEnv("MINIO_ACCESS_KEY"),
  secretKey: requiredEnv("MINIO_SECRET_KEY"),
});

export default minioClient;
