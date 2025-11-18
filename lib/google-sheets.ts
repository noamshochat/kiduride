import { Ride, Passenger } from './demo-data'

// Google Sheets configuration
const SPREADSHEET_ID = process.env.GOOGLE_SHEET_ID || '1V7oh1-EUyIYNzJf4NkNBHSUMV4BbWtt3-HdXRdTzMsI'
const USE_GOOGLE_SHEETS = !!(
  process.env.GOOGLE_SERVICE_ACCOUNT_KEY || 
  process.env.GOOGLE_SERVICE_ACCOUNT_PATH ||
  process.env.GOOGLE_CLIENT_ID // OAuth 2.0 support
)

// Initialize Google Sheets API (only if credentials are provided)
async function getSheetsClient() {
  if (!USE_GOOGLE_SHEETS) {
    return null
  }

  try {
    const { google } = await import('googleapis')
    
    // Option 1: Using Service Account from environment variable
    if (process.env.GOOGLE_SERVICE_ACCOUNT_KEY) {
      try {
        // Handle both string and already-parsed JSON
        let serviceAccount: any
        if (typeof process.env.GOOGLE_SERVICE_ACCOUNT_KEY === 'string') {
          // Remove surrounding quotes if present
          const keyString = process.env.GOOGLE_SERVICE_ACCOUNT_KEY.trim()
          const cleanedKey = keyString.startsWith("'") && keyString.endsWith("'") 
            ? keyString.slice(1, -1) 
            : keyString
          serviceAccount = JSON.parse(cleanedKey)
        } else {
          serviceAccount = process.env.GOOGLE_SERVICE_ACCOUNT_KEY
        }
        
        // Ensure private_key has proper newlines
        if (serviceAccount.private_key && typeof serviceAccount.private_key === 'string') {
          serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, '\n')
        }
        
        const auth = new google.auth.GoogleAuth({
          credentials: serviceAccount,
          scopes: ['https://www.googleapis.com/auth/spreadsheets'],
        })
        return google.sheets({ version: 'v4', auth })
      } catch (error) {
        console.error('Error parsing service account key:', error)
        console.error('Tip: Try using GOOGLE_SERVICE_ACCOUNT_PATH instead')
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

    // Option 3: Using OAuth 2.0 (for organization restrictions)
    if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET && process.env.GOOGLE_REFRESH_TOKEN) {
      const auth = new google.auth.OAuth2(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET,
        process.env.GOOGLE_REDIRECT_URI || 'http://localhost:3000'
      )
      
      auth.setCredentials({
        refresh_token: process.env.GOOGLE_REFRESH_TOKEN,
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
    return null
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

// Simple cache to reduce API calls
let ridesCache: { data: Ride[]; timestamp: number } | null = null
const CACHE_DURATION = 30000 // 30 seconds cache

export const googleSheets = {
  // Get all rides (across all date sheets) - with caching
  async getRides(): Promise<Ride[]> {
    // Return empty if Google Sheets not configured
    if (!USE_GOOGLE_SHEETS) {
      return []
    }

    // Return cached data if still valid
    if (ridesCache && Date.now() - ridesCache.timestamp < CACHE_DURATION) {
      return ridesCache.data
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
            if (row.length > 0 && row[0] && typeof row[0] === 'string' && row[0].startsWith('r')) {
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
            // Handle rows that have rideId but missing passenger ID
            if (row.length >= 2 && row[1] && typeof row[1] === 'string' && row[1].startsWith('r')) {
              const rideId = row[1]
              
              // If passenger ID is missing but we have child name, reconstruct
              if ((!row[0] || row[0].trim() === '') && row.length >= 3 && row[2] && row[2].trim() !== '') {
                const childName = row[2]
                const parentId = row.length >= 4 ? row[3] : ''
                const parentName = row.length >= 5 ? row[4] : ''
                const pickupFromHome = row.length >= 6 ? row[5] === 'TRUE' : false
                const pickupAddress = row.length >= 7 ? row[6] : undefined
                
                const passenger: Passenger = {
                  id: `p${Date.now()}-temp`,
                  childName: childName,
                  parentId: parentId || '',
                  parentName: parentName || '',
                  pickupFromHome: pickupFromHome,
                  pickupAddress: pickupAddress,
                }
                
                if (!allPassengers[rideId]) {
                  allPassengers[rideId] = []
                }
                allPassengers[rideId].push(passenger)
              } else if (row[0] && typeof row[0] === 'string' && row[0].startsWith('p')) {
                // Normal case: passenger ID exists
                const passenger = rowToPassenger(row)
                const rideId = row[1]
                
                if (rideId) {
                  if (!allPassengers[rideId]) {
                    allPassengers[rideId] = []
                  }
                  allPassengers[rideId].push(passenger)
                }
              }
            } else if (row.length > 0 && row[0] && typeof row[0] === 'string' && row[0].startsWith('p')) {
              // Passenger ID exists but rideId might be missing
              const passenger = rowToPassenger(row)
              let rideId = row[1]
              
              // If rideId is missing, try to find it by matching to a ride in the same sheet
              if (!rideId || rideId.trim() === '') {
                const matchingRide = allRides.find(r => r.date === sheetName)
                if (matchingRide) {
                  rideId = matchingRide.id
                }
              }
              
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

      // Cache the results
      ridesCache = {
        data: allRides,
        timestamp: Date.now()
      }

      return allRides
    } catch (error) {
      console.error('Error reading rides from Google Sheets:', error)
      return []
    }
  },
  
  // Clear cache (call this after write operations)
  clearCache(): void {
    ridesCache = null
  },

  // Get a single ride by ID
  async getRideById(id: string): Promise<Ride | undefined> {
    try {
      const allRides = await this.getRides()
      return allRides.find((r) => r.id === id)
    } catch (error) {
      console.error('Error fetching ride by id:', error)
      return undefined
    }
  },

  // Get rides for a specific date - optimized to only read that date's sheet
  async getRidesByDate(date: string): Promise<Ride[]> {
    if (!USE_GOOGLE_SHEETS) {
      return []
    }

    try {
      const sheets = await getSheetsClient()
      if (!sheets) {
        return []
      }

      const sheetName = getSheetNameForDate(date)
      const allRides: Ride[] = []
      const allPassengers: { [rideId: string]: Passenger[] } = {}

      try {
        // Read rides (columns A-J, starting from row 2) - only for this date
        const ridesResponse = await sheets.spreadsheets.values.get({
          spreadsheetId: SPREADSHEET_ID,
          range: `${sheetName}!A2:J`,
        })

        const rideRows = ridesResponse.data.values || []
        rideRows.forEach((row) => {
          if (row.length > 0 && row[0] && typeof row[0] === 'string' && row[0].startsWith('r')) {
            const ride = rowToRide(row)
            allRides.push(ride)
          }
        })

        // Read passengers (columns K-Q, starting from row 2) - only for this date
        const passengersResponse = await sheets.spreadsheets.values.get({
          spreadsheetId: SPREADSHEET_ID,
          range: `${sheetName}!K2:Q`,
        })

        const passengerRows = passengersResponse.data.values || []
        passengerRows.forEach((row) => {
          if (row.length >= 2 && row[1] && typeof row[1] === 'string' && row[1].startsWith('r')) {
            const rideId = row[1]
            
            if ((!row[0] || row[0].trim() === '') && row.length >= 3 && row[2] && row[2].trim() !== '') {
              const childName = row[2]
              const parentId = row.length >= 4 ? row[3] : ''
              const parentName = row.length >= 5 ? row[4] : ''
              const pickupFromHome = row.length >= 6 ? row[5] === 'TRUE' : false
              const pickupAddress = row.length >= 7 ? row[6] : undefined
              
              const passenger: Passenger = {
                id: `p${Date.now()}-temp`,
                childName: childName,
                parentId: parentId || '',
                parentName: parentName || '',
                pickupFromHome: pickupFromHome,
                pickupAddress: pickupAddress,
              }
              
              if (!allPassengers[rideId]) {
                allPassengers[rideId] = []
              }
              allPassengers[rideId].push(passenger)
            } else if (row[0] && typeof row[0] === 'string' && row[0].startsWith('p')) {
              const passenger = rowToPassenger(row)
              if (rideId) {
                if (!allPassengers[rideId]) {
                  allPassengers[rideId] = []
                }
                allPassengers[rideId].push(passenger)
              }
            }
          } else if (row.length > 0 && row[0] && typeof row[0] === 'string' && row[0].startsWith('p')) {
            const passenger = rowToPassenger(row)
            let rideId = row[1]
            
            if (!rideId || rideId.trim() === '') {
              const matchingRide = allRides[0] // If only one ride on this date
              if (matchingRide) {
                rideId = matchingRide.id
              }
            }
            
            if (rideId) {
              if (!allPassengers[rideId]) {
                allPassengers[rideId] = []
              }
              allPassengers[rideId].push(passenger)
            }
          }
        })

        // Attach passengers to rides
        allRides.forEach((ride) => {
          ride.passengers = allPassengers[ride.id] || []
        })

        return allRides
      } catch (error) {
        // Sheet might not exist yet, return empty array
        return []
      }
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

      // Clear cache after write operation
      this.clearCache()

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

      // Clear cache after write operation
      this.clearCache()

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
      
      // Validate rideId is present
      if (!rideId || rideId.trim() === '') {
        throw new Error('Invalid rideId')
      }
      
      const passengerRow = passengerToRow(passenger, rideId)
      
      // Validate passengerRow has all required data
      if (!passengerRow[1] || passengerRow[1] !== rideId) {
        throw new Error('Failed to create passenger row with rideId')
      }

      // Ensure we have exactly 7 columns (K through Q)
      if (passengerRow.length !== 7) {
        throw new Error(`Invalid passenger row length: ${passengerRow.length}, expected 7`)
      }

      // Find the next empty row in the passenger section (columns K-Q)
      // First, get all existing passenger data to find the last row
      const existingPassengers = await sheets.spreadsheets.values.get({
        spreadsheetId: SPREADSHEET_ID,
        range: `${sheetName}!K:Q`,
      })
      
      const existingRows = existingPassengers.data.values || []
      // Find the last row with data (skip header row 1, so start from index 1)
      let nextRow = 2 // Start after header
      if (existingRows.length > 1) {
        // Find the last non-empty row
        for (let i = existingRows.length - 1; i >= 1; i--) {
          if (existingRows[i] && existingRows[i].length > 0 && existingRows[i].some(cell => cell && cell.toString().trim() !== '')) {
            nextRow = i + 2 // +2 because array is 0-indexed and we skip header
            break
          }
        }
        if (nextRow === 2 && existingRows.length > 1) {
          nextRow = existingRows.length + 1
        }
      }
      
      // Use update instead of append to ensure data goes to the correct columns
      await sheets.spreadsheets.values.update({
        spreadsheetId: SPREADSHEET_ID,
        range: `${sheetName}!K${nextRow}:Q${nextRow}`,
        valueInputOption: 'USER_ENTERED',
        requestBody: {
          values: [passengerRow],
        },
      })
      
      // Clear cache after write operation
      this.clearCache()

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

      // Clear cache after write operation
      this.clearCache()

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
