const ALLOWED_EXT = /\.(csv|xlsx|xls)$/i;
const MAX_BYTES = 5 * 1024 * 1024;

/** Client-side checks before bulk invitation upload. */
export function validateInviteFile(file: File): string | null {
  if (!ALLOWED_EXT.test(file.name)) {
    return 'CSV(.csv) 또는 Excel(.xlsx, .xls) 파일만 업로드할 수 있습니다.';
  }
  if (file.size <= 0) {
    return '빈 파일은 업로드할 수 없습니다.';
  }
  if (file.size > MAX_BYTES) {
    return '파일 크기는 5MB 이하여야 합니다.';
  }
  return null;
}
