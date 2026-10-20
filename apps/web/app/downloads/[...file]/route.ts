import { NextResponse } from 'next/server';

const GOOGLE_DRIVE_APK_DOWNLOAD = 'https://drive.usercontent.google.com/download?id=1MoQLR6XmFy_B9uAF1okhc87vrH8CqJat&export=download&confirm=t';

export async function GET() {
  return NextResponse.redirect(GOOGLE_DRIVE_APK_DOWNLOAD, 307);
}
