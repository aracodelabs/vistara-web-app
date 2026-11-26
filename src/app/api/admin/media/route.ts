import { NextRequest, NextResponse } from "next/server";
import { logAdminActivity, requireAdminApiSession } from "@/lib/admin-auth";
import { getClientIp } from "@/lib/admin-defaults";
import {
  deleteMediaAssetById,
  listMediaAssetsWithUsage,
  storeValidatedImage,
} from "@/lib/storage/image-storage";

export async function GET(request: NextRequest) {
  const auth = await requireAdminApiSession("media:read");
  if (!auth.ok) {
    return NextResponse.json(
      { ok: false, error: auth.error },
      { status: auth.status }
    );
  }

  try {
    const { searchParams } = new URL(request.url);
    const sourceFilter = searchParams.get("source")?.trim() || "all";
    const query = searchParams.get("q")?.trim().toLowerCase() || "";

    const allItems = await listMediaAssetsWithUsage();
    const items = allItems.filter((item) => {
      if (sourceFilter !== "all" && item.source !== sourceFilter) {
        return false;
      }
      if (query) {
        const hay = `${item.filename} ${item.prompt || ""} ${item.url}`.toLowerCase();
        if (!hay.includes(query)) return false;
      }
      return true;
    });

    return NextResponse.json({ ok: true, items }, { status: 200 });
  } catch (error) {
    console.error("Error listing media assets:", error);
    return NextResponse.json(
      { ok: false, error: "Unable to load media assets." },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const auth = await requireAdminApiSession("media:write");
  if (!auth.ok) {
    return NextResponse.json(
      { ok: false, error: auth.error },
      { status: auth.status }
    );
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json(
        { ok: false, error: "Please attach an image file." },
        { status: 400 }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    let asset;
    try {
      asset = await storeValidatedImage({
        buffer,
        filename: file.name || "upload.jpg",
        declaredMimeType: file.type,
        source: "manual",
        uploadedBy: auth.user.id,
      });
    } catch (validationErr) {
      return NextResponse.json(
        {
          ok: false,
          error:
            validationErr instanceof Error
              ? validationErr.message
              : "Invalid image upload.",
        },
        { status: 400 }
      );
    }

    await logAdminActivity({
      adminUserId: auth.user.id,
      action: "media_uploaded",
      entityType: "media_asset",
      entityId: String(asset.id),
      details: {
        filename: asset.filename,
        mimeType: asset.mime_type,
        sizeBytes: asset.size_bytes,
      },
      ipAddress: getClientIp(request),
    });

    return NextResponse.json(
      { ok: true, item: { ...asset, usedIn: [] } },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error uploading media asset:", error);
    return NextResponse.json(
      { ok: false, error: "Unable to upload media asset." },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  const auth = await requireAdminApiSession("media:delete");
  if (!auth.ok) {
    return NextResponse.json(
      { ok: false, error: auth.error },
      { status: auth.status }
    );
  }

  try {
    const { searchParams } = new URL(request.url);
    let id = Number.parseInt(searchParams.get("id") || "", 10);
    if (!Number.isInteger(id) || id <= 0) {
      const body = await request.json().catch(() => null);
      id = Number(body?.id);
    }

    if (!Number.isInteger(id) || id <= 0) {
      return NextResponse.json(
        { ok: false, error: "Invalid media asset id." },
        { status: 400 }
      );
    }

    const result = await deleteMediaAssetById(id);
    if (!result.ok) {
      return NextResponse.json(
        { ok: false, error: result.error || "Unable to delete media asset." },
        { status: result.status }
      );
    }

    await logAdminActivity({
      adminUserId: auth.user.id,
      action: "media_deleted",
      entityType: "media_asset",
      entityId: String(id),
      ipAddress: getClientIp(request),
    });

    return NextResponse.json({ ok: true, id }, { status: 200 });
  } catch (error) {
    console.error("Error deleting media asset:", error);
    return NextResponse.json(
      { ok: false, error: "Unable to delete media asset." },
      { status: 500 }
    );
  }
}
