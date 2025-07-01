"use client"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { 
  GripVertical, 
  Trash2, 
  Plus, 
  Settings, 
  Eye,
  Save,
  X,
  Move,
  Type,
  Hash,
  Calendar,
  Mail,
  Phone,
  FileText,
  CheckSquare,
  List,
  Upload
} from "lucide-react"
import { FORM_FIELD_TEMPLATES, type FormField, type CustomForm } from "@/types"
import { toast } from "@/components/ui/use-toast"
import { v4 as uuidv4 } from "uuid"
import { Dialog as ShadDialog, DialogContent as ShadDialogContent, DialogHeader as ShadDialogHeader, DialogTitle as ShadDialogTitle } from "@/components/ui/dialog"

interface FormBuilderProps {
  eventId: string
  onSave: (form: CustomForm) => void
  initialForm?: CustomForm | null
}

export function FormBuilder({ eventId, onSave, initialForm }: FormBuilderProps) {
  const [form, setForm] = useState<CustomForm>(
    initialForm || {
      id: uuidv4(),
      eventId,
      title: "Event Registration Form",
      description: "",
      fields: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    }
  )
  const [editingField, setEditingField] = useState<FormField | null>(null)
  const [showFieldEditor, setShowFieldEditor] = useState(false)
  const [draggedField, setDraggedField] = useState<Omit<FormField, 'id' | 'order'> | null>(null)
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null)
  const [showCustomFieldDialog, setShowCustomFieldDialog] = useState(false)
  const [customFieldType, setCustomFieldType] = useState<null | FormField['type']>(null)
  const [customFieldLabel, setCustomFieldLabel] = useState("")
  const [customFieldPlaceholder, setCustomFieldPlaceholder] = useState("")
  const [customFieldRequired, setCustomFieldRequired] = useState(false)
  const [customFieldOptions, setCustomFieldOptions] = useState("")

  const getFieldIcon = (type: FormField['type']) => {
    switch (type) {
      case 'text': return <Type className="w-4 h-4" />
      case 'email': return <Mail className="w-4 h-4" />
      case 'phone': return <Phone className="w-4 h-4" />
      case 'number': return <Hash className="w-4 h-4" />
      case 'date': return <Calendar className="w-4 h-4" />
      case 'select': return <List className="w-4 h-4" />
      case 'radio': return <List className="w-4 h-4" />
      case 'checkbox': return <CheckSquare className="w-4 h-4" />
      case 'textarea': return <FileText className="w-4 h-4" />
      case 'file': return <Upload className="w-4 h-4" />
      default: return <Type className="w-4 h-4" />
    }
  }

  const handleDragStart = (field: Omit<FormField, 'id' | 'order'>) => {
    setDraggedField(field)
  }

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault()
    setDragOverIndex(index)
  }

  const handleDrop = (e: React.DragEvent, index: number) => {
    e.preventDefault()
    if (draggedField) {
      const newField: FormField = {
        ...draggedField,
        id: uuidv4(),
        order: index,
      }
      
      const updatedFields = [...form.fields]
      updatedFields.splice(index, 0, newField)
      
      // Update order numbers
      updatedFields.forEach((field, idx) => {
        field.order = idx
      })
      
      setForm({
        ...form,
        fields: updatedFields,
        updatedAt: new Date(),
      })
    }
    setDraggedField(null)
    setDragOverIndex(null)
  }

  const handleFieldDrop = (e: React.DragEvent) => {
    e.preventDefault()
    if (draggedField) {
      const newField: FormField = {
        ...draggedField,
        id: uuidv4(),
        order: form.fields.length,
      }
      
      setForm({
        ...form,
        fields: [...form.fields, newField],
        updatedAt: new Date(),
      })
    }
    setDraggedField(null)
    setDragOverIndex(null)
  }

  const updateField = (fieldId: string, updates: Partial<FormField>) => {
    setForm({
      ...form,
      fields: form.fields.map(field => 
        field.id === fieldId ? { ...field, ...updates } : field
      ),
      updatedAt: new Date(),
    })
  }

  const deleteField = (fieldId: string) => {
    setForm({
      ...form,
      fields: form.fields.filter(field => field.id !== fieldId),
      updatedAt: new Date(),
    })
  }

  const moveField = (fieldId: string, direction: 'up' | 'down') => {
    const currentIndex = form.fields.findIndex(field => field.id === fieldId)
    if (currentIndex === -1) return

    const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1
    if (newIndex < 0 || newIndex >= form.fields.length) return

    const updatedFields = [...form.fields]
    const [movedField] = updatedFields.splice(currentIndex, 1)
    updatedFields.splice(newIndex, 0, movedField)

    // Update order numbers
    updatedFields.forEach((field, idx) => {
      field.order = idx
    })

    setForm({
      ...form,
      fields: updatedFields,
      updatedAt: new Date(),
    })
  }

  const handleSave = () => {
    if (form.fields.length === 0) {
      toast({
        title: "No Fields Added",
        description: "Please add at least one field to your form.",
        variant: "destructive",
      })
      return
    }

    onSave(form)
    toast({
      title: "Form Saved",
      description: "Your custom registration form has been saved successfully.",
    })
  }

  const handleAddCustomField = () => {
    if (!customFieldType || !customFieldLabel.trim()) return
    const newField: FormField = {
      id: uuidv4(),
      type: customFieldType,
      label: customFieldLabel,
      placeholder: customFieldPlaceholder,
      required: customFieldRequired,
      options: (customFieldType === 'select' || customFieldType === 'radio' || customFieldType === 'checkbox')
        ? customFieldOptions.split('\n').map(opt => opt.trim()).filter(Boolean)
        : undefined,
      order: form.fields.length,
    }
    setForm({
      ...form,
      fields: [...form.fields, newField],
      updatedAt: new Date(),
    })
    setShowCustomFieldDialog(false)
    setCustomFieldType(null)
    setCustomFieldLabel("")
    setCustomFieldPlaceholder("")
    setCustomFieldRequired(false)
    setCustomFieldOptions("")
  }

  return (
    <div className="space-y-6">
      {/* Form Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Form Builder
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="form-title">Form Title</Label>
              <Input
                id="form-title"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="Enter form title"
              />
            </div>
            <div>
              <Label htmlFor="form-description">Description (Optional)</Label>
              <Input
                id="form-description"
                value={form.description || ""}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Enter form description"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Field Library */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="w-5 h-5" />
              Field Library
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Button className="w-full mb-4" variant="outline" onClick={() => setShowCustomFieldDialog(true)}>
              + Add Custom Question
            </Button>
            <ScrollArea className="h-[600px]">
              <div className="space-y-2">
                {FORM_FIELD_TEMPLATES.map((field, index) => (
                  <div
                    key={index}
                    draggable
                    onDragStart={() => handleDragStart(field)}
                    className="p-3 border border-gray-200 rounded-lg cursor-move hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <GripVertical className="w-4 h-4 text-gray-400" />
                      {getFieldIcon(field.type)}
                      <span className="text-sm font-medium">{field.label}</span>
                      {field.required && (
                        <Badge variant="destructive" className="text-xs">Required</Badge>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 mt-1 ml-6">
                      {field.type.charAt(0).toUpperCase() + field.type.slice(1)} field
                    </p>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Form Canvas */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Eye className="w-5 h-5" />
                Form Preview
              </CardTitle>
              <Button onClick={handleSave} className="flex items-center gap-2">
                <Save className="w-4 h-4" />
                Save Form
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div
              className="min-h-[600px] border-2 border-dashed border-gray-300 rounded-lg p-4"
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleFieldDrop}
            >
              {form.fields.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-gray-500">
                  <Move className="w-12 h-12 mb-4" />
                  <p className="text-lg font-medium">Drag fields here to build your form</p>
                  <p className="text-sm">Start by dragging fields from the library on the left</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {form.fields.map((field, index) => (
                    <div
                      key={field.id}
                      className={`relative p-4 border rounded-lg ${
                        dragOverIndex === index ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                      }`}
                      onDragOver={(e) => handleDragOver(e, index)}
                      onDrop={(e) => handleDrop(e, index)}
                    >
                      {/* Field Header */}
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <GripVertical className="w-4 h-4 text-gray-400" />
                          {getFieldIcon(field.type)}
                          <span className="font-medium">{field.label}</span>
                          {field.required && (
                            <Badge variant="destructive" className="text-xs">Required</Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setEditingField(field)
                              setShowFieldEditor(true)
                            }}
                          >
                            <Settings className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteField(field.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>

                      {/* Field Preview */}
                      <div className="ml-6">
                        {field.type === 'text' && (
                          <Input placeholder={field.placeholder || field.label} disabled />
                        )}
                        {field.type === 'email' && (
                          <Input type="email" placeholder={field.placeholder || field.label} disabled />
                        )}
                        {field.type === 'phone' && (
                          <Input type="tel" placeholder={field.placeholder || field.label} disabled />
                        )}
                        {field.type === 'number' && (
                          <Input type="number" placeholder={field.placeholder || field.label} disabled />
                        )}
                        {field.type === 'date' && (
                          <Input type="date" disabled />
                        )}
                        {field.type === 'select' && (
                          <Select disabled>
                            <SelectTrigger>
                              <SelectValue placeholder={field.placeholder || "Select an option"} />
                            </SelectTrigger>
                            <SelectContent>
                              {field.options?.map((option, idx) => (
                                <SelectItem key={idx} value={option}>
                                  {option}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}
                        {field.type === 'radio' && (
                          <div className="space-y-2">
                            {field.options?.map((option, idx) => (
                              <div key={idx} className="flex items-center space-x-2">
                                <input type="radio" disabled />
                                <Label className="text-sm">{option}</Label>
                              </div>
                            ))}
                          </div>
                        )}
                        {field.type === 'checkbox' && (
                          <div className="space-y-2">
                            {field.options?.map((option, idx) => (
                              <div key={idx} className="flex items-center space-x-2">
                                <input type="checkbox" disabled />
                                <Label className="text-sm">{option}</Label>
                              </div>
                            ))}
                          </div>
                        )}
                        {field.type === 'textarea' && (
                          <Textarea placeholder={field.placeholder || field.label} disabled />
                        )}
                        {field.type === 'file' && (
                          <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                            <Upload className="w-6 h-6 mx-auto mb-2 text-gray-400" />
                            <p className="text-sm text-gray-500">{field.placeholder || "Click to upload file"}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Field Editor Dialog */}
      <Dialog open={showFieldEditor} onOpenChange={setShowFieldEditor}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Field</DialogTitle>
          </DialogHeader>
          {editingField && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="field-label">Label</Label>
                <Input
                  id="field-label"
                  value={editingField.label}
                  onChange={(e) => setEditingField({ ...editingField, label: e.target.value })}
                />
              </div>
              
              <div>
                <Label htmlFor="field-placeholder">Placeholder</Label>
                <Input
                  id="field-placeholder"
                  value={editingField.placeholder || ""}
                  onChange={(e) => setEditingField({ ...editingField, placeholder: e.target.value })}
                />
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="field-required"
                  checked={editingField.required}
                  onCheckedChange={(checked) => setEditingField({ ...editingField, required: checked })}
                />
                <Label htmlFor="field-required">Required field</Label>
              </div>

              {(editingField.type === 'select' || editingField.type === 'radio' || editingField.type === 'checkbox') && (
                <div>
                  <Label>Options (one per line)</Label>
                  <Textarea
                    value={editingField.options?.join('\n') || ""}
                    onChange={(e) => setEditingField({
                      ...editingField,
                      options: e.target.value.split('\n').filter(option => option.trim())
                    })}
                    placeholder="Option 1&#10;Option 2&#10;Option 3"
                  />
                </div>
              )}

              <div className="flex justify-end space-x-2">
                <Button
                  variant="outline"
                  onClick={() => setShowFieldEditor(false)}
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => {
                    if (editingField) {
                      updateField(editingField.id, editingField)
                      setShowFieldEditor(false)
                      setEditingField(null)
                    }
                  }}
                >
                  Save Changes
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Add Custom Question Dialog */}
      <ShadDialog open={showCustomFieldDialog} onOpenChange={setShowCustomFieldDialog}>
        <ShadDialogContent className="max-w-md">
          <ShadDialogHeader>
            <ShadDialogTitle>Add Custom Question</ShadDialogTitle>
          </ShadDialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Field Type</Label>
              <Select value={customFieldType || ""} onValueChange={setCustomFieldType as any}>
                <SelectTrigger className="mt-2">
                  <SelectValue placeholder="Select field type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="text">Short Text</SelectItem>
                  <SelectItem value="textarea">Paragraph</SelectItem>
                  <SelectItem value="email">Email</SelectItem>
                  <SelectItem value="phone">Phone</SelectItem>
                  <SelectItem value="number">Number</SelectItem>
                  <SelectItem value="date">Date</SelectItem>
                  <SelectItem value="select">Dropdown (Select)</SelectItem>
                  <SelectItem value="radio">Multiple Choice (Radio)</SelectItem>
                  <SelectItem value="checkbox">Checkboxes</SelectItem>
                  <SelectItem value="file">File Upload</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Label</Label>
              <Input value={customFieldLabel} onChange={e => setCustomFieldLabel(e.target.value)} placeholder="Enter question label" />
            </div>
            <div>
              <Label>Placeholder (optional)</Label>
              <Input value={customFieldPlaceholder} onChange={e => setCustomFieldPlaceholder(e.target.value)} placeholder="Enter placeholder text" />
            </div>
            <div className="flex items-center space-x-2">
              <Switch id="custom-field-required" checked={customFieldRequired} onCheckedChange={setCustomFieldRequired} />
              <Label htmlFor="custom-field-required">Required</Label>
            </div>
            {(customFieldType === 'select' || customFieldType === 'radio' || customFieldType === 'checkbox') && (
              <div>
                <Label>Options (one per line)</Label>
                <Textarea value={customFieldOptions} onChange={e => setCustomFieldOptions(e.target.value)} placeholder={"Option 1\nOption 2\nOption 3"} />
              </div>
            )}
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setShowCustomFieldDialog(false)}>Cancel</Button>
              <Button onClick={handleAddCustomField} disabled={!customFieldType || !customFieldLabel.trim()}>Add</Button>
            </div>
          </div>
        </ShadDialogContent>
      </ShadDialog>
    </div>
  )
} 
