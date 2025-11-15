import { Ride, Passenger } from './demo-data'

// Google Sheets configuration
const SPREADSHEET_ID = process.env.GOOGLE_SHEET_ID || '1V7oh1-EUyIYNzJf4NkNBHSUMV4BbWtt3-HdXRdTzMsI'
const USE_GOOGLE_SHEETS = !!(process.env.GOOGLE_SERVICE_ACCOUNT_KEY || process.env.GOOGLE_SERVICE_ACCOUNT_PATH)

// Initialize Google Sheets API (only if credentials are provided)
async function getSheetsClient() {
  if (!USE_GOOGLE_SHEETS) {
    return null
  }

  try {
    const { google } = await import('googleapis')
    
    // Option 1: Using Service Account from environment variable (Recommended)
    if (process.env.GOOGLE_SERVICE_ACCOUNT_KEY) {
      try {
        const serviceAccount = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_KEY)
        const auth = new google.auth.GoogleAuth({
          credentials: serviceAccount,
          scopes: ['https://www.googleapis.com/auth/spreadsheets'],
        })
        return google.sheets({ version: 'v4', auth })
      } catch (error) {
        console.error('Error parsing service account key:', error)
      }
    }

    // Option 2: Using Service Account from file path
    if (process.env.GOOGLE_SERVICE_ACCOUNT_PATH) {
      const auth = new google.auth.GoogleAuth({
        keyFile: process.env.GOOGLE_SERVICE_ACCOUNT_PATH,
        scopes: ['https://www.googleapis.com/auth/spreadsheets'],
      })
      return google.sheets({ version: 'v4', auth })
    }

    // Fallback: Default auth
    const auth = new google.auth.GoogleAuth({
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    })
    return google.sheets({ version: 'v4', auth })
  } catch (error) {
    console.error('Error initializing Google Sheets client:', error)
    return null // Fall back to file system
  }
}

// Get sheet name for a date (format: YYYY-MM-DD)
function getSheetNameForDate(date: string): string {
  return date // Use date as sheet name, e.g., "2025-11-20"
}

// Ensure a sheet exists for a given date
async function ensureSheetExists(date: string): Promise<void> {
  const sheets = await getSheetsClient()
  if (!sheets) return

  const sheetName = getSheetNameForDate(date)

  try {
    // Check if sheet exists
    const spreadsheet = await sheets.spreadsheets.get({
      spreadsheetId: SPREADSHEET_ID,
    })

    const sheetExists = spreadsheet.data.sheets?.some(
      (sheet) => sheet.properties?.title === sheetName
    )

    if (!sheetExists) {
      // Create new sheet for this date
      await sheets.spreadsheets.batchUpdate({
        spreadsheetId: SPREADSHEET_ID,
        requestBody: {
          requests: [
            {
              addSheet: {
                properties: {
                  title: sheetName,
                },
              },
            },
          ],
        },
      })

      // Add headers
      await sheets.spreadsheets.values.update({
        spreadsheetId: SPREADSHEET_ID,
        range: `${sheetName}!A1:J1`,
        valueInputOption: 'RAW',
        requestBody: {
          values: [[
            'ID',
            'Driver ID',
            'Driver Name',
            'Date',
            'Direction',
            'Total Seats',
            'Available Seats',
            'Pickup Address',
            'Notes',
            'Created At',
          ]],
        },
      })

      // Add passenger headers in a separate section (starting at row 1, column K)
      await sheets.spreadsheets.values.update({
        spreadsheetId: SPREADSHEET_ID,
        range: `${sheetName}!K1:Q1`,
        valueInputOption: 'RAW',
        requestBody: {
          values: [[
            'Passenger ID',
            'Ride ID',
            'Child Name',
            'Parent ID',
            'Parent Name',
            'Pickup From Home',
            'Pickup Address',
          ]],
        },
      })
    }
  } catch (error) {
    console.error(`Error ensuring sheet exists for date ${date}:`, error)
    throw error
  }
}

// Convert ride to row format
function rideToRow(ride: Ride): any[] {
  return [
    ride.id,
    ride.driverId,
    ride.driverName,
    ride.date,
    ride.direction,
    ride.totalSeats.toString(),
    ride.availableSeats.toString(),
    ride.pickupAddress,
    ride.notes || '',
    ride.createdAt,
  ]
}

// Convert row to ride
function rowToRide(row: any[]): Ride {
  return {
    id: row[0],
    driverId: row[1],
    driverName: row[2],
    date: row[3],
    direction: row[4],
    totalSeats: parseInt(row[5]) || 0,
    availableSeats: parseInt(row[6]) || 0,
    pickupAddress: row[7],
    notes: row[8] || undefined,
    passengers: [], // Will be loaded separately
    createdAt: row[9],
  }
}

// Convert passenger to row format
function passengerToRow(passenger: Passenger, rideId: string): any[] {
  return [
    passenger.id,
    rideId,
    passenger.childName,
    passenger.parentId,
    passenger.parentName,
    passenger.pickupFromHome ? 'TRUE' : 'FALSE',
    passenger.pickupAddress || '',
  ]
}

// Convert row to passenger
function rowToPassenger(row: any[]): Passenger {
  return {
    id: row[0],
    childName: row[2],
    parentId: row[3],
    parentName: row[4],
    pickupFromHome: row[5] === 'TRUE',
    pickupAddress: row[6] || undefined,
  }
}

export const googleSheets = {
  // Get all rides (across all date sheets)
  async getRides(): Promise<Ride[]> {
    // Return empty if Google Sheets not configured
    if (!USE_GOOGLE_SHEETS) {
      return []
    }

    try {
      const sheets = await getSheetsClient()
      if (!sheets) {
        return []
      }

      const spreadsheet = await sheets.spreadsheets.get({
        spreadsheetId: SPREADSHEET_ID,
      })

      const allRides: Ride[] = []
      const allPassengers: { [rideId: string]: Passenger[] } = {}

      // Iterate through all sheets
      for (const sheet of spreadsheet.data.sheets || []) {
        const sheetName = sheet.properties?.title
        if (!sheetName || sheetName.startsWith('_')) continue // Skip hidden/system sheets

        try {
          // Read rides (columns A-J, starting from row 2)
          const ridesResponse = await sheets.spreadsheets.values.get({
            spreadsheetId: SPREADSHEET_ID,
            range: `${sheetName}!A2:J`,
          })

          const rideRows = ridesResponse.data.values || []
          rideRows.forEach((row) => {
            if (row.length > 0 && row[0]) {
              // Only process rows with data
              const ride = rowToRide(row)
              allRides.push(ride)
            }
          })

          // Read passengers (columns K-Q, starting from row 2)
          const passengersResponse = await sheets.spreadsheets.values.get({
            spreadsheetId: SPREADSHEET_ID,
            range: `${sheetName}!K2:Q`,
          })

          const passengerRows = passengersResponse.data.values || []
          passengerRows.forEach((row) => {
            if (row.length > 0 && row[0]) {
              const passenger = rowToPassenger(row)
              const rideId = row[1]
              if (rideId) {
                if (!allPassengers[rideId]) {
                  allPassengers[rideId] = []
                }
                allPassengers[rideId].push(passenger)
              }
            }
          })
        } catch (error) {
          console.error(`Error reading sheet ${sheetName}:`, error)
          // Continue with other sheets
        }
      }

      // Attach passengers to rides
      allRides.forEach((ride) => {
        ride.passengers = allPassengers[ride.id] || []
      })

      return allRides
    } catch (error) {
      console.error('Error reading rides from Google Sheets:', error)
      return []
    }
  },

  // Get rides for a specific date
  async getRidesByDate(date: string): Promise<Ride[]> {
    try {
      const allRides = await this.getRides()
      return allRides.filter((r) => r.date === date)
    } catch (error) {
      console.error('Error fetching rides by date:', error)
      return []
    }
  },

  // Create a new ride
  async createRide(ride: Omit<Ride, 'id' | 'passengers' | 'createdAt'>): Promise<Ride> {
    if (!USE_GOOGLE_SHEETS) {
      const error: any = new Error('Google Sheets not configured')
      error.code = 'GOOGLE_SHEETS_NOT_CONFIGURED'
      throw error
    }

    const newRide: Ride = {
      ...ride,
      id: `r${Date.now()}`,
      passengers: [],
      createdAt: new Date().toISOString(),
    }

    try {
      const sheets = await getSheetsClient()
      if (!sheets) {
        throw new Error('Failed to initialize Google Sheets client')
      }

      await ensureSheetExists(ride.date)

      const sheetName = getSheetNameForDate(ride.date)

      // Add ride to sheet
      await sheets.spreadsheets.values.append({
        spreadsheetId: SPREADSHEET_ID,
        range: `${sheetName}!A:J`,
        valueInputOption: 'USER_ENTERED',
        requestBody: {
          values: [rideToRow(newRide)],
        },
      })

      return newRide
    } catch (error) {
      console.error('Error creating ride in Google Sheets:', error)
      throw error
    }
  },

  // Delete a ride
  async deleteRide(rideId: string): Promise<boolean> {
    if (!USE_GOOGLE_SHEETS) {
      const error: any = new Error('Google Sheets not configured')
      error.code = 'GOOGLE_SHEETS_NOT_CONFIGURED'
      throw error
    }

    const rides = await this.getRides()
    const ride = rides.find((r) => r.id === rideId)
    if (!ride) return false

    try {
      const sheets = await getSheetsClient()
      if (!sheets) {
        return false
      }

      const sheetName = getSheetNameForDate(ride.date)

      // Find the row index
      const ridesResponse = await sheets.spreadsheets.values.get({
        spreadsheetId: SPREADSHEET_ID,
        range: `${sheetName}!A2:J`,
      })

      const rows = ridesResponse.data.values || []
      const rideIndex = rows.findIndex((row) => row[0] === rideId)

      if (rideIndex === -1) return false

      const sheetId = await this.getSheetId(sheetName)

      // Delete ride row
      await sheets.spreadsheets.batchUpdate({
        spreadsheetId: SPREADSHEET_ID,
        requestBody: {
          requests: [
            {
              deleteDimension: {
                range: {
                  sheetId,
                  dimension: 'ROWS',
                  startIndex: rideIndex + 1, // +1 for header row
                  endIndex: rideIndex + 2,
                },
              },
            },
          ],
        },
      })

      return true
    } catch (error) {
      console.error('Error deleting ride from Google Sheets:', error)
      return false
    }
  },

  // Add passenger to a ride
  async addPassenger(rideId: string, passenger: Passenger): Promise<boolean> {
    if (!USE_GOOGLE_SHEETS) {
      const error: any = new Error('Google Sheets not configured')
      error.code = 'GOOGLE_SHEETS_NOT_CONFIGURED'
      throw error
    }

    const rides = await this.getRides()
    const ride = rides.find((r) => r.id === rideId)
    if (!ride) return false

    try {
      const sheets = await getSheetsClient()
      if (!sheets) {
        return false
      }

      const sheetName = getSheetNameForDate(ride.date)

      await sheets.spreadsheets.values.append({
        spreadsheetId: SPREADSHEET_ID,
        range: `${sheetName}!K:Q`,
        valueInputOption: 'USER_ENTERED',
        requestBody: {
          values: [passengerToRow(passenger, rideId)],
        },
      })

      // Update ride's available seats
      await this.updateRideSeats(rideId)

      return true
    } catch (error) {
      console.error('Error adding passenger to Google Sheets:', error)
      return false
    }
  },

  // Remove passenger from a ride
  async removePassenger(rideId: string, passengerId: string): Promise<boolean> {
    if (!USE_GOOGLE_SHEETS) {
      const error: any = new Error('Google Sheets not configured')
      error.code = 'GOOGLE_SHEETS_NOT_CONFIGURED'
      throw error
    }

    const rides = await this.getRides()
    const ride = rides.find((r) => r.id === rideId)
    if (!ride) return false

    try {
      const sheets = await getSheetsClient()
      if (!sheets) {
        return false
      }

      const sheetName = getSheetNameForDate(ride.date)

      const passengersResponse = await sheets.spreadsheets.values.get({
        spreadsheetId: SPREADSHEET_ID,
        range: `${sheetName}!K2:Q`,
      })

      const rows = passengersResponse.data.values || []
      const passengerIndex = rows.findIndex((row) => row[0] === passengerId && row[1] === rideId)

      if (passengerIndex === -1) return false

      const sheetId = await this.getSheetId(sheetName)

      await sheets.spreadsheets.batchUpdate({
        spreadsheetId: SPREADSHEET_ID,
        requestBody: {
          requests: [
            {
              deleteDimension: {
                range: {
                  sheetId,
                  dimension: 'ROWS',
                  startIndex: passengerIndex + 1,
                  endIndex: passengerIndex + 2,
                },
              },
            },
          ],
        },
      })

      // Update ride's available seats
      await this.updateRideSeats(rideId)

      return true
    } catch (error) {
      console.error('Error removing passenger from Google Sheets:', error)
      return false
    }
  },

  // Helper: Get sheet ID by name
  async getSheetId(sheetName: string): Promise<number> {
    const sheets = await getSheetsClient()
    if (!sheets) return 0

    const response = await sheets.spreadsheets.get({
      spreadsheetId: SPREADSHEET_ID,
    })
    const sheet = response.data.sheets?.find((s) => s.properties?.title === sheetName)
    return sheet?.properties?.sheetId || 0
  },

  // Helper: Update ride's available seats
  async updateRideSeats(rideId: string): Promise<void> {
    if (!USE_GOOGLE_SHEETS) {
      return
    }

    const rides = await this.getRides()
    const ride = rides.find((r) => r.id === rideId)
    if (!ride) return

    ride.availableSeats = ride.totalSeats - ride.passengers.length

    const sheets = await getSheetsClient()
    if (!sheets) {
      return
    }

    const sheetName = getSheetNameForDate(ride.date)

    const ridesResponse = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: `${sheetName}!A2:J`,
    })

    const rows = ridesResponse.data.values || []
    const rideIndex = rows.findIndex((row) => row[0] === rideId)
    if (rideIndex === -1) return

    // Update the available seats column (column G, index 6)
    await sheets.spreadsheets.values.update({
      spreadsheetId: SPREADSHEET_ID,
      range: `${sheetName}!G${rideIndex + 2}`, // +2 because of header and 0-indexing
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [[ride.availableSeats.toString()]],
      },
    })
  },
}
