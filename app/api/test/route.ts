export async function GET() {
  return Response.json({
    exists: !!process.env.MONGODB_URI,
    nodeEnv: process.env.NODE_ENV,
  });
}
