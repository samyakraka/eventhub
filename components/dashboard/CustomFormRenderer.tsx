"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { toast } from "@/components/ui/use-toast"
import type { CustomForm, FormField } from "@/types"

interface CustomFormRendererProps {
  form: CustomForm
  onSubmit: (formData: Record<string, any>) => void
  loading?: boolean
}

export function CustomFormRenderer({ form, onSubmit, loading = false }: CustomFormRendererProps) {
  const [formData, setFormData] = useState<Record<string, any>>({})
  const [errors, setErrors] = useState<Record<string, string>>({})

  const handleFieldChange = (fieldId: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [fieldId]: value
    }))
    
    // Clear error when user starts typing
    if (errors[fieldId]) {
      setErrors(prev => ({
        ...prev,
        [fieldId]: ""
      }))
    }
  }

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}
    
    form.fields.forEach(field => {
      const value = formData[field.id]
      
      if (field.required) {
        if (!value || (Array.isArray(value) && value.length === 0) || (typeof value === 'string' && value.trim() === '')) {
          newErrors[field.id] = `${field.label} is required`
        }
      }
      
      // Additional validation based on field type
      if (value && field.type === 'email') {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        if (!emailRegex.test(value)) {
          newErrors[field.id] = 'Please enter a valid email address'
        }
      }
      
      if (value && field.type === 'phone') {
        const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/
        if (!phoneRegex.test(value.replace(/\s/g, ''))) {
          newErrors[field.id] = 'Please enter a valid phone number'
        }
      }
      
      if (value && field.type === 'number') {
        const num = parseFloat(value)
        if (isNaN(num)) {
          newErrors[field.id] = 'Please enter a valid number'
        }
        if (field.validation?.min && num < field.validation.min) {
          newErrors[field.id] = `Minimum value is ${field.validation.min}`
        }
        if (field.validation?.max && num > field.validation.max) {
          newErrors[field.id] = `Maximum value is ${field.validation.max}`
        }
      }
      
      if (value && field.type === 'text' && field.validation?.minLength && value.length < field.validation.minLength) {
        newErrors[field.id] = `Minimum ${field.validation.minLength} characters required`
      }
      
      if (value && field.type === 'text' && field.validation?.maxLength && value.length > field.validation.maxLength) {
        newErrors[field.id] = `Maximum ${field.validation.maxLength} characters allowed`
      }
    })
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (validateForm()) {
      onSubmit(formData)
    } else {
      toast({
        title: "Validation Error",
        description: "Please fix the errors in the form before submitting.",
        variant: "destructive",
      })
    }
  }

  const renderField = (field: FormField) => {
    const fieldValue = formData[field.id]
    const fieldError = errors[field.id]

    const commonProps = {
      id: field.id,
      value: fieldValue || "",
      onChange: (value: any) => handleFieldChange(field.id, value),
      placeholder: field.placeholder,
      className: fieldError ? "border-red-500" : "",
    }

    switch (field.type) {
      case 'text':
        return (
          <div key={field.id} className="space-y-2">
            <Label htmlFor={field.id} className="flex items-center gap-2">
              {field.label}
              {field.required && <Badge variant="destructive" className="text-xs">Required</Badge>}
            </Label>
            <Input
              id={field.id}
              value={fieldValue || ""}
              onChange={e => handleFieldChange(field.id, e.target.value)}
              placeholder={field.placeholder}
              className={fieldError ? "border-red-500" : ""}
              type="text"
            />
            {fieldError && <p className="text-sm text-red-500">{fieldError}</p>}
          </div>
        )

      case 'email':
        return (
          <div key={field.id} className="space-y-2">
            <Label htmlFor={field.id} className="flex items-center gap-2">
              {field.label}
              {field.required && <Badge variant="destructive" className="text-xs">Required</Badge>}
            </Label>
            <Input
              id={field.id}
              value={fieldValue || ""}
              onChange={e => handleFieldChange(field.id, e.target.value)}
              placeholder={field.placeholder}
              className={fieldError ? "border-red-500" : ""}
              type="email"
            />
            {fieldError && <p className="text-sm text-red-500">{fieldError}</p>}
          </div>
        )

      case 'phone':
        return (
          <div key={field.id} className="space-y-2">
            <Label htmlFor={field.id} className="flex items-center gap-2">
              {field.label}
              {field.required && <Badge variant="destructive" className="text-xs">Required</Badge>}
            </Label>
            <Input
              id={field.id}
              value={fieldValue || ""}
              onChange={e => handleFieldChange(field.id, e.target.value)}
              placeholder={field.placeholder}
              className={fieldError ? "border-red-500" : ""}
              type="tel"
            />
            {fieldError && <p className="text-sm text-red-500">{fieldError}</p>}
          </div>
        )

      case 'number':
        return (
          <div key={field.id} className="space-y-2">
            <Label htmlFor={field.id} className="flex items-center gap-2">
              {field.label}
              {field.required && <Badge variant="destructive" className="text-xs">Required</Badge>}
            </Label>
            <Input
              id={field.id}
              value={fieldValue || ""}
              onChange={e => handleFieldChange(field.id, e.target.value)}
              placeholder={field.placeholder}
              className={fieldError ? "border-red-500" : ""}
              type="number"
              min={field.validation?.min}
              max={field.validation?.max}
            />
            {fieldError && <p className="text-sm text-red-500">{fieldError}</p>}
          </div>
        )

      case 'date':
        return (
          <div key={field.id} className="space-y-2">
            <Label htmlFor={field.id} className="flex items-center gap-2">
              {field.label}
              {field.required && <Badge variant="destructive" className="text-xs">Required</Badge>}
            </Label>
            <Input
              id={field.id}
              value={fieldValue || ""}
              onChange={e => handleFieldChange(field.id, e.target.value)}
              placeholder={field.placeholder}
              className={fieldError ? "border-red-500" : ""}
              type="date"
            />
            {fieldError && <p className="text-sm text-red-500">{fieldError}</p>}
          </div>
        )

      case 'select':
        return (
          <div key={field.id} className="space-y-2">
            <Label htmlFor={field.id} className="flex items-center gap-2">
              {field.label}
              {field.required && <Badge variant="destructive" className="text-xs">Required</Badge>}
            </Label>
            <Select
              value={fieldValue || ""}
              onValueChange={(value) => handleFieldChange(field.id, value)}
            >
              <SelectTrigger className={fieldError ? "border-red-500" : ""}>
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
            {fieldError && <p className="text-sm text-red-500">{fieldError}</p>}
          </div>
        )

      case 'radio':
        return (
          <div key={field.id} className="space-y-2">
            <Label className="flex items-center gap-2">
              {field.label}
              {field.required && <Badge variant="destructive" className="text-xs">Required</Badge>}
            </Label>
            <RadioGroup
              value={fieldValue || ""}
              onValueChange={(value) => handleFieldChange(field.id, value)}
            >
              {field.options?.map((option, idx) => (
                <div key={idx} className="flex items-center space-x-2">
                  <RadioGroupItem value={option} id={`${field.id}-${idx}`} />
                  <Label htmlFor={`${field.id}-${idx}`} className="text-sm">{option}</Label>
                </div>
              ))}
            </RadioGroup>
            {fieldError && <p className="text-sm text-red-500">{fieldError}</p>}
          </div>
        )

      case 'checkbox':
        return (
          <div key={field.id} className="space-y-2">
            <Label className="flex items-center gap-2">
              {field.label}
              {field.required && <Badge variant="destructive" className="text-xs">Required</Badge>}
            </Label>
            <div className="space-y-2">
              {field.options?.map((option, idx) => (
                <div key={idx} className="flex items-center space-x-2">
                  <Checkbox
                    id={`${field.id}-${idx}`}
                    checked={fieldValue?.includes(option) || false}
                    onCheckedChange={(checked) => {
                      const currentValues = fieldValue || []
                      const newValues = checked
                        ? [...currentValues, option]
                        : currentValues.filter((val: string) => val !== option)
                      handleFieldChange(field.id, newValues)
                    }}
                  />
                  <Label htmlFor={`${field.id}-${idx}`} className="text-sm">{option}</Label>
                </div>
              ))}
            </div>
            {fieldError && <p className="text-sm text-red-500">{fieldError}</p>}
          </div>
        )

      case 'textarea':
        return (
          <div key={field.id} className="space-y-2">
            <Label htmlFor={field.id} className="flex items-center gap-2">
              {field.label}
              {field.required && <Badge variant="destructive" className="text-xs">Required</Badge>}
            </Label>
            <Textarea
              id={field.id}
              value={fieldValue || ""}
              onChange={e => handleFieldChange(field.id, e.target.value)}
              placeholder={field.placeholder}
              className={fieldError ? "border-red-500" : ""}
              rows={4}
            />
            {fieldError && <p className="text-sm text-red-500">{fieldError}</p>}
          </div>
        )

      case 'file':
        return (
          <div key={field.id} className="space-y-2">
            <Label htmlFor={field.id} className="flex items-center gap-2">
              {field.label}
              {field.required && <Badge variant="destructive" className="text-xs">Required</Badge>}
            </Label>
            <Input
              {...commonProps}
              type="file"
              onChange={(e) => handleFieldChange(field.id, e.target.files?.[0])}
            />
            {fieldError && <p className="text-sm text-red-500">{fieldError}</p>}
          </div>
        )

      default:
        return null
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{form.title}</CardTitle>
        {form.description && (
          <p className="text-sm text-gray-600">{form.description}</p>
        )}
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {form.fields.map(renderField)}
          
          <Button 
            type="submit" 
            className="w-full" 
            disabled={loading}
          >
            {loading ? "Submitting..." : "Submit Registration"}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
} 
