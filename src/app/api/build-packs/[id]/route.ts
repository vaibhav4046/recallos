import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request, { params }: { params: { id: string } }) {
  const url = new URL(req.url);
  const format = url.searchParams.get("format");
  const pack = await prisma.buildPack.findUnique({
    where: { id: params.id },
    include: { project: true },
  });
  if (!pack) return NextResponse.json({ error: "not_found" }, { status: 404 });
  if (format === "markdown") {
    return new NextResponse(pack.markdown, {
      headers: {
        "Content-Type": "text/markdown",
        "Content-Disposition": `attachment; filename="${pack.project.title}.md"`,
      },
    });
  }
  if (format === "readme") {
    return new NextResponse(pack.readme, {
      headers: {
        "Content-Type": "text/markdown",
        "Content-Disposition": `attachment; filename="README.md"`,
      },
    });
  }
  if (format === "checklist") {
    return new NextResponse(pack.checklist, {
      headers: {
        "Content-Type": "text/markdown",
        "Content-Disposition": `attachment; filename="checklist.md"`,
      },
    });
  }
  return NextResponse.json({ buildPack: pack });
}
