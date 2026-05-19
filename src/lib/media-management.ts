import { deleteDriveFile } from "./drive";
import {
  deleteMediaItem,
  deleteMediaItems,
  getMediaRecord,
  getMediaRecords,
} from "./media";

export async function deleteManagedMediaById(id: string) {
  const record = await getMediaRecord(id);
  if (!record) {
    return { deleted: false, found: false };
  }

  await deleteDriveFile(record.drive_file_id);
  if (record.thumbnail_drive_file_id) {
    await deleteDriveFile(record.thumbnail_drive_file_id);
  }
  await deleteMediaItem(id);

  return { deleted: true, found: true };
}

export async function deleteManagedMediaBatch(ids: string[]) {
  const records = await getMediaRecords(ids);
  if (!records.length) {
    return { deletedIds: [], failedIds: [], found: false };
  }

  const deletedIds: string[] = [];
  const failedIds: string[] = [];

  for (const record of records) {
    try {
      await deleteDriveFile(record.drive_file_id);
      if (record.thumbnail_drive_file_id) {
        await deleteDriveFile(record.thumbnail_drive_file_id);
      }
      await deleteMediaItems([record.id]);
      deletedIds.push(record.id);
    } catch {
      failedIds.push(record.id);
    }
  }

  return {
    deletedIds,
    failedIds,
    found: true,
  };
}
