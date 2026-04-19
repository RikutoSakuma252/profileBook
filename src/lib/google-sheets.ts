import { google } from "googleapis";

function getCredentials() {
  const raw = process.env.GOOGLE_SERVICE_ACCOUNT_KEY;
  if (!raw) {
    throw new Error(
      "GOOGLE_SERVICE_ACCOUNT_KEY is not set. Paste the service account JSON into .env."
    );
  }
  try {
    return JSON.parse(raw);
  } catch {
    throw new Error("GOOGLE_SERVICE_ACCOUNT_KEY is not valid JSON.");
  }
}

function getSheetsClient() {
  const auth = new google.auth.GoogleAuth({
    credentials: getCredentials(),
    scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
  });
  return google.sheets({ version: "v4", auth });
}

export type SheetRows = {
  headers: string[];
  dataRows: string[][];
};

export async function fetchSheetRows(
  spreadsheetId: string,
  sheetName: string
): Promise<SheetRows> {
  const sheets = getSheetsClient();
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: sheetName,
    valueRenderOption: "FORMATTED_VALUE",
    dateTimeRenderOption: "FORMATTED_STRING",
  });
  const rows = (res.data.values ?? []) as string[][];
  if (rows.length === 0) return { headers: [], dataRows: [] };
  const [headers, ...dataRows] = rows;
  return {
    headers: headers.map((h) => String(h ?? "").trim()),
    dataRows,
  };
}
