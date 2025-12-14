'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Plus, Trash2, Lock, Link2 } from 'lucide-react'
import { Checkbox } from '@/components/ui/checkbox'
import { ChildAutocomplete } from '@/components/child-autocomplete'
import { Child, User } from '@/lib/demo-data'
import { supabaseDb } from '@/lib/supabase-db'

interface ChildInput {
  firstName: string
  lastName: string
  isRegisteredKidu: boolean
  isRegisteredTennis: boolean
}

export default function BackofficePage() {
  const router = useRouter()
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [password, setPassword] = useState('')
  const [isValidating, setIsValidating] = useState(false)
  const [error, setError] = useState('')
  
  // Form state
  const [parentName, setParentName] = useState('')
  const [parentEmail, setParentEmail] = useState('')
  const [parentPhone, setParentPhone] = useState('')
  const [childName, setChildName] = useState('')
  const [children, setChildren] = useState<ChildInput[]>([])
  const [isRegisteredKidu, setIsRegisteredKidu] = useState(false)
  const [isRegisteredTennis, setIsRegisteredTennis] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')

  // Link parent to existing child state
  const [selectedChild, setSelectedChild] = useState<Child | null>(null)
  const [parentEmailSearch, setParentEmailSearch] = useState('')
  const [foundParent, setFoundParent] = useState<User | null>(null)
  const [isLinking, setIsLinking] = useState(false)
  const [linkError, setLinkError] = useState('')
  const [linkSuccess, setLinkSuccess] = useState('')

  // Check if already authenticated (stored in sessionStorage)
  useEffect(() => {
    const authStatus = sessionStorage.getItem('backoffice_authenticated')
    if (authStatus === 'true') {
      setIsAuthenticated(true)
    }
  }, [])

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsValidating(true)
    setError('')

    try {
      const response = await fetch('/api/backoffice/validate-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      })

      const data = await response.json()

      if (data.valid === true) {
        setIsAuthenticated(true)
        sessionStorage.setItem('backoffice_authenticated', 'true')
        setPassword('')
      } else {
        setError('Invalid password. Please try again.')
        setPassword('')
      }
    } catch (error) {
      console.error('Error validating password:', error)
      setError('An error occurred. Please try again.')
    } finally {
      setIsValidating(false)
    }
  }

  const handleAddChild = () => {
    setChildren([...children, { firstName: '', lastName: '', isRegisteredKidu: false, isRegisteredTennis: false }])
  }

  const handleRemoveChild = (index: number) => {
    setChildren(children.filter((_, i) => i !== index))
  }

  const handleChildChange = (index: number, field: 'firstName' | 'lastName', value: string) => {
    const updated = [...children]
    updated[index][field] = value
    setChildren(updated)
  }

  const handleChildActivityChange = (index: number, activity: 'kidu' | 'tennis', checked: boolean) => {
    const updated = [...children]
    if (activity === 'kidu') {
      updated[index].isRegisteredKidu = checked
    } else {
      updated[index].isRegisteredTennis = checked
    }
    setChildren(updated)
  }

  // Search for parent by email
  const handleSearchParent = async () => {
    if (!parentEmailSearch.trim()) {
      setLinkError('Please enter a parent email')
      setFoundParent(null)
      return
    }

    try {
      const parent = await supabaseDb.getUserByEmail(parentEmailSearch.trim())
      if (parent) {
        setFoundParent(parent)
        setLinkError('')
      } else {
        setFoundParent(null)
        setLinkError('Parent not found with this email')
      }
    } catch (error) {
      console.error('Error searching parent:', error)
      setLinkError('Error searching for parent')
      setFoundParent(null)
    }
  }

  // Link parent to child
  const handleLinkParentToChild = async () => {
    if (!selectedChild) {
      setLinkError('Please select a child')
      return
    }

    if (!foundParent) {
      setLinkError('Please search and find a parent first')
      return
    }

    setIsLinking(true)
    setLinkError('')
    setLinkSuccess('')

    try {
      const updatedChild = await supabaseDb.linkParentToChild(selectedChild.id, foundParent.id)
      setLinkSuccess(`Successfully linked ${foundParent.name} (${foundParent.email}) to ${updatedChild.firstName}${updatedChild.lastName ? ' ' + updatedChild.lastName : ''}`)
      // Reset form
      setSelectedChild(null)
      setParentEmailSearch('')
      setFoundParent(null)
    } catch (error: any) {
      console.error('Error linking parent:', error)
      setLinkError(error.message || 'Failed to link parent to child')
    } finally {
      setIsLinking(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError('')
    setSuccessMessage('')

    // Validation
    if (!parentName.trim()) {
      setError('Parent name is required')
      setIsSubmitting(false)
      return
    }

    if (!parentEmail.trim()) {
      setError('Parent email is required')
      setIsSubmitting(false)
      return
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(parentEmail.trim())) {
      setError('Invalid email format')
      setIsSubmitting(false)
      return
    }

    // Validate children
    const validChildren = children.filter(c => c.firstName.trim())
    if (validChildren.length === 0 && !childName.trim()) {
      setError('Please provide at least one child name or add children')
      setIsSubmitting(false)
      return
    }

    try {
      const requestBody = {
        name: parentName.trim(),
        email: parentEmail.trim(),
        phone: parentPhone.trim() || undefined,
        childName: childName.trim() || undefined,
        children: validChildren.length > 0 ? validChildren.map(c => ({
          firstName: c.firstName.trim(),
          lastName: c.lastName.trim() || undefined,
          isRegisteredKidu: c.isRegisteredKidu,
          isRegisteredTennis: c.isRegisteredTennis,
        })) : undefined,
        isRegisteredKidu,
        isRegisteredTennis,
      }
      
      console.log('Sending request to API:', JSON.stringify(requestBody, null, 2))
      console.log('Valid children count:', validChildren.length)
      console.log('Valid children:', validChildren)
      
      const response = await fetch('/api/backoffice/create-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      })

      const data = await response.json()
      console.log('API Response:', JSON.stringify(data, null, 2))
      console.log('Response status:', response.status)
      console.log('Response ok:', response.ok)

      if (response.ok) {
        const childrenCount = data.children?.length || 0
        setSuccessMessage(`Successfully created user: ${data.user.name} (${data.user.email})${childrenCount > 0 ? ` with ${childrenCount} child(ren)` : ''}`)
        console.log(`Created ${childrenCount} children`)
        // Reset form
        setParentName('')
        setParentEmail('')
        setParentPhone('')
        setChildName('')
        setChildren([])
        setIsRegisteredKidu(false)
        setIsRegisteredTennis(false)
      } else {
        const errorMsg = data.error || 'Failed to create user'
        const detailsMsg = data.details ? ` Details: ${JSON.stringify(data.details)}` : ''
        console.error('API Error:', errorMsg, detailsMsg)
        setError(errorMsg + detailsMsg)
      }
    } catch (error) {
      console.error('Error creating user:', error)
      setError('An error occurred. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Password protection screen
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
              <Lock className="h-6 w-6 text-primary" />
            </div>
            <CardTitle className="text-2xl font-bold">Backoffice Access</CardTitle>
            <CardDescription>
              Please enter the password to access the backoffice
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoFocus
                />
              </div>
              {error && (
                <div className="text-sm text-destructive">{error}</div>
              )}
              <Button type="submit" className="w-full" disabled={isValidating}>
                {isValidating ? 'Validating...' : 'Access Backoffice'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Main backoffice interface
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-4xl mx-auto">
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-3xl font-bold">Backoffice</CardTitle>
            <CardDescription>
              Add new parents and their children to the system
            </CardDescription>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Add Parent & Children</CardTitle>
            <CardDescription>
              Fill in the parent information and add their children
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Parent Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Parent Information</h3>
                
                <div className="space-y-2">
                  <Label htmlFor="parentName">Parent Name *</Label>
                  <Input
                    id="parentName"
                    type="text"
                    placeholder="Enter parent's full name"
                    value={parentName}
                    onChange={(e) => setParentName(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="parentEmail">Email *</Label>
                  <Input
                    id="parentEmail"
                    type="email"
                    placeholder="Enter parent's email"
                    value={parentEmail}
                    onChange={(e) => setParentEmail(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="parentPhone">Phone (Optional)</Label>
                  <Input
                    id="parentPhone"
                    type="tel"
                    placeholder="Enter parent's phone number"
                    value={parentPhone}
                    onChange={(e) => setParentPhone(e.target.value)}
                  />
                </div>

                {/* Activity Registration */}
                <div className="space-y-3 pt-2">
                  <Label>Activity Registration</Label>
                  <div className="flex flex-col gap-3">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="registeredKidu"
                        checked={isRegisteredKidu}
                        onCheckedChange={(checked) => setIsRegisteredKidu(checked === true)}
                      />
                      <Label htmlFor="registeredKidu" className="font-normal cursor-pointer">
                        Registered for Kidumathematics
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="registeredTennis"
                        checked={isRegisteredTennis}
                        onCheckedChange={(checked) => setIsRegisteredTennis(checked === true)}
                      />
                      <Label htmlFor="registeredTennis" className="font-normal cursor-pointer">
                        Registered for Tennis Hanuka Camp
                      </Label>
                    </div>
                  </div>
                </div>
              </div>

              {/* Child Name (Legacy field) */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Child Information</h3>
                
                <div className="space-y-2">
                  <Label htmlFor="childName">Child Name (Optional - use if only one child)</Label>
                  <Input
                    id="childName"
                    type="text"
                    placeholder="Enter child's name"
                    value={childName}
                    onChange={(e) => setChildName(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    This field is used for backward compatibility. If you're adding multiple children, use the "Add Children" section below.
                  </p>
                </div>
              </div>

              {/* Multiple Children */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">Children</h3>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleAddChild}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Child
                  </Button>
                </div>

                {children.length === 0 && (
                  <p className="text-sm text-muted-foreground">
                    No children added yet. Click "Add Child" to add children, or use the "Child Name" field above for a single child.
                  </p>
                )}

                {children.map((child, index) => (
                  <div key={index} className="p-4 border rounded-lg space-y-4">
                    <div className="flex gap-2 items-end">
                      <div className="flex-1 space-y-2">
                        <Label htmlFor={`childFirstName-${index}`}>First Name *</Label>
                        <Input
                          id={`childFirstName-${index}`}
                          type="text"
                          placeholder="First name"
                          value={child.firstName}
                          onChange={(e) => handleChildChange(index, 'firstName', e.target.value)}
                          required
                        />
                      </div>
                      <div className="flex-1 space-y-2">
                        <Label htmlFor={`childLastName-${index}`}>Last Name</Label>
                        <Input
                          id={`childLastName-${index}`}
                          type="text"
                          placeholder="Last name (optional)"
                          value={child.lastName}
                          onChange={(e) => handleChildChange(index, 'lastName', e.target.value)}
                        />
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemoveChild(index)}
                        className="mb-0"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="space-y-2">
                      <Label>Activity Registration</Label>
                      <div className="flex gap-4">
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id={`childKidu-${index}`}
                            checked={child.isRegisteredKidu}
                            onCheckedChange={(checked) => handleChildActivityChange(index, 'kidu', checked === true)}
                          />
                          <Label htmlFor={`childKidu-${index}`} className="font-normal cursor-pointer text-sm">
                            Kidumathematics
                          </Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id={`childTennis-${index}`}
                            checked={child.isRegisteredTennis}
                            onCheckedChange={(checked) => handleChildActivityChange(index, 'tennis', checked === true)}
                          />
                          <Label htmlFor={`childTennis-${index}`} className="font-normal cursor-pointer text-sm">
                            Tennis Hanuka Camp
                          </Label>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Error and Success Messages */}
              {error && (
                <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
                  <p className="text-sm text-destructive">{error}</p>
                </div>
              )}

              {successMessage && (
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-sm text-green-800">{successMessage}</p>
                </div>
              )}

              {/* Submit Button */}
              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? 'Creating...' : 'Create Parent & Children'}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Link Parent to Existing Child */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Link Parent to Existing Child</CardTitle>
            <CardDescription>
              Add a parent to a child that already exists in the system
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {/* Select Child */}
              <div className="space-y-2">
                <Label>Select Child</Label>
                <ChildAutocomplete
                  value={selectedChild}
                  onChange={(child) => {
                    setSelectedChild(child)
                    setLinkError('')
                    setLinkSuccess('')
                  }}
                  placeholder="Search for an existing child..."
                />
                {selectedChild && (
                  <p className="text-sm text-muted-foreground">
                    Selected: {selectedChild.firstName}{selectedChild.lastName ? ' ' + selectedChild.lastName : ''}
                  </p>
                )}
              </div>

              {/* Search Parent */}
              <div className="space-y-2">
                <Label htmlFor="parentEmailSearch">Search Parent by Email</Label>
                <div className="flex gap-2">
                  <Input
                    id="parentEmailSearch"
                    type="email"
                    placeholder="Enter parent's email address"
                    value={parentEmailSearch}
                    onChange={(e) => {
                      setParentEmailSearch(e.target.value)
                      setFoundParent(null)
                      setLinkError('')
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        handleSearchParent()
                      }
                    }}
                  />
                  <Button
                    type="button"
                    onClick={handleSearchParent}
                    disabled={!parentEmailSearch.trim()}
                  >
                    Search
                  </Button>
                </div>
                {foundParent && (
                  <div className="p-3 bg-green-50 border border-green-200 rounded-md">
                    <p className="text-sm font-medium text-green-800">
                      Found: {foundParent.name} ({foundParent.email})
                    </p>
                    {foundParent.phone && (
                      <p className="text-xs text-green-700 mt-1">Phone: {foundParent.phone}</p>
                    )}
                  </div>
                )}
              </div>

              {/* Error and Success Messages */}
              {linkError && (
                <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
                  <p className="text-sm text-destructive">{linkError}</p>
                </div>
              )}

              {linkSuccess && (
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-sm text-green-800">{linkSuccess}</p>
                </div>
              )}

              {/* Link Button */}
              <Button
                type="button"
                onClick={handleLinkParentToChild}
                disabled={!selectedChild || !foundParent || isLinking}
                className="w-full"
              >
                <Link2 className="h-4 w-4 mr-2" />
                {isLinking ? 'Linking...' : 'Link Parent to Child'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

