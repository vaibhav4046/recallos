import { NextResponse } from "next/server";
import { prisma, getDemoUser } from "@/lib/prisma";

// Strip anything that could break out of the Content-Disposition header
// (quotes, newlines, control chars, path separators) before using a
// user-controlled title as a download filename.
function safeFilename(name: string, fallback: string): string {
  const cleaned = name.replace(/[^\w.\- ]+/g, "_").trim().slice(0, 80);
  return cleaned || fallback;
}

export async function GET(req: Request, { params }: { params: { id: string } }) {
  const url = new URL(req.url);
  const format = url.searchParams.get("format");
  const user = await getDemoUser();
  const pack = await prisma.buildPack.findFirst({
    where: { id: params.id, userId: user.id },
    include: { project: true },
  });
  if (!pack) return NextResponse.json({ error: "not_found" }, { status: 404 });
  if (format === "markdown") {
    const filename = safeFilename(pack.project.title, "build-pack");
    return new NextResponse(pack.markdown, {
      headers: {
        "Content-Type": "text/markdown",
        "Content-Disposition": `attachment; filename="${filename}.md"`,
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
