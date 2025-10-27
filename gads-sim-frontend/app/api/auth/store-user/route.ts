import { NextRequest, NextResponse } from 'next/server';
import { google } from 'googleapis';
import { userDataConfig, getAllFieldNames, getDefaultValues } from '@/lib/user-data-config';

export async function POST(request: NextRequest) {
  try {
    const userData = await request.json();
    
    // Extract IP and User Agent
    const ipAddress = request.headers.get('x-forwarded-for') || 
                     request.headers.get('x-real-ip') || 
                     'unknown';
    const userAgent = request.headers.get('user-agent') || 'unknown';

    // Prepare data to store based on configuration
    const defaultValues = getDefaultValues();
    const dataToStore = {
      ...defaultValues,
      ipAddress,
      userAgent,
      ...userData
    };

    // Filter data based on configuration
    const filteredData = {};
    getAllFieldNames().forEach(field => {
      if (dataToStore[field] !== undefined) {
        filteredData[field] = dataToStore[field];
      }
    });

    // Store in Google Sheets
    await storeInGoogleSheets(filteredData);

    return NextResponse.json({ success: true, message: 'User data stored successfully' });
  } catch (error) {
    console.error('Error storing user data:', error);
    return NextResponse.json(
      { error: 'Failed to store user data' },
      { status: 500 }
    );
  }
}

async function storeInGoogleSheets(data: any) {
  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      private_key: process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    },
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });

  const sheets = google.sheets({ version: 'v4', auth });
  const spreadsheetId = process.env.GOOGLE_SHEETS_ID;

  // Prepare row data
  const rowData = Object.values(data);
  const headerRow = Object.keys(data);

  try {
    // Check if sheet exists, if not create it
    const sheetExists = await checkSheetExists(sheets, spreadsheetId, userDataConfig.sheetConfig.name);
    
    if (!sheetExists && userDataConfig.sheetConfig.autoCreate) {
      await createSheetWithHeaders(sheets, spreadsheetId, userDataConfig.sheetConfig.name, headerRow);
    }

    // Append the data
    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: `${userDataConfig.sheetConfig.name}!A:Z`,
      valueInputOption: 'RAW',
      requestBody: {
        values: [rowData],
      },
    });

    console.log('User data stored successfully in Google Sheets');
  } catch (error) {
    console.error('Error storing in Google Sheets:', error);
    throw error;
  }
}

async function checkSheetExists(sheets: any, spreadsheetId: string, sheetName: string): Promise<boolean> {
  try {
    const response = await sheets.spreadsheets.get({
      spreadsheetId,
    });
    
    return response.data.sheets.some((sheet: any) => sheet.properties.title === sheetName);
  } catch (error) {
    return false;
  }
}

async function createSheetWithHeaders(sheets: any, spreadsheetId: string, sheetName: string, headers: string[]) {
  try {
    // Add new sheet
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId,
      requestBody: {
        requests: [{
          addSheet: {
            properties: {
              title: sheetName,
            },
          },
        }],
      },
    });

    // Add headers
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: `${sheetName}!A1:${String.fromCharCode(65 + headers.length - 1)}1`,
      valueInputOption: 'RAW',
      requestBody: {
        values: [headers],
      },
    });

    // Format headers
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId,
      requestBody: {
        requests: [{
          repeatCell: {
            range: {
              sheetId: 0,
              startRowIndex: 0,
              endRowIndex: 1,
              startColumnIndex: 0,
              endColumnIndex: headers.length,
            },
            cell: {
              userEnteredFormat: {
                backgroundColor: { red: 0.9, green: 0.9, blue: 0.9 },
                textFormat: { bold: true },
              },
            },
            fields: 'userEnteredFormat(backgroundColor,textFormat)',
          },
        }],
      },
    });

    console.log(`Sheet '${sheetName}' created with headers`);
  } catch (error) {
    console.error('Error creating sheet:', error);
    throw error;
  }
}
