import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { listBooks } from "@/lib/books/queries";
import {
  buildExportBody,
  exportContentType,
  exportFilename,
} from "@/lib/books/export";
import type { BookListKind } from "@/types/book";
import type { ExportFormat } from "@/types/export";

const FORMATS: ExportFormat[] = ["json", "csv", "xlsx"];
const LISTS: BookListKind[] = ["library", "wishlist"];

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  }

  const { searchParams } = request.nextUrl;
  const formatParam = searchParams.get("format") ?? "json";
  const listParam = searchParams.get("list") ?? "library";

  if (!FORMATS.includes(formatParam as ExportFormat)) {
    return NextResponse.json({ error: "Invalid format." }, { status: 400 });
  }

  if (!LISTS.includes(listParam as BookListKind)) {
    return NextResponse.json({ error: "Invalid list." }, { status: 400 });
  }

  const format = formatParam as ExportFormat;
  const list = listParam as BookListKind;

  try {
    const books = await listBooks(session.user.id, { list });
    const body = buildExportBody(books, list, format);
    const filename = exportFilename(list, format);

    if (format === "xlsx" && body instanceof Buffer) {
      return new NextResponse(new Uint8Array(body), {
        headers: {
          "Content-Type": exportContentType(format),
          "Content-Disposition": `attachment; filename="${filename}"`,
          "Cache-Control": "no-store",
        },
      });
    }

    return new NextResponse(String(body), {
      headers: {
        "Content-Type": exportContentType(format),
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch {
    return NextResponse.json({ error: "Export failed." }, { status: 500 });
  }
}
