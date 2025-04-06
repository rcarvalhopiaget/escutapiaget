'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { File, FileX, Upload, FileCheck } from 'lucide-react'

export interface FileUploadProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  helperText?: string
  error?: string
  onFileSelect?: (files: File[]) => void
  maxSizeMB?: number
  multiple?: boolean
  accept?: string
}

const DEFAULT_ACCEPTED_FORMATS = [
  // Imagens
  'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml',
  // Vídeos
  'video/mp4', 'video/webm', 'video/ogg',
  // PDFs
  'application/pdf',
  // Documentos Office
  'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .doc, .docx
  'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xls, .xlsx
  'application/vnd.ms-powerpoint', 'application/vnd.openxmlformats-officedocument.presentationml.presentation', // .ppt, .pptx
  // Arquivos compactados
  'application/zip', 'application/x-rar-compressed', 'application/x-7z-compressed'
]

export function FileUpload({
  className,
  label,
  helperText,
  error,
  onFileSelect,
  maxSizeMB = 10, // Tamanho máximo padrão: 10MB
  accept,
  multiple = false,
  onChange,
  ...props
}: FileUploadProps) {
  const [files, setFiles] = React.useState<File[]>([])
  const [isDragging, setIsDragging] = React.useState(false)
  const [uploadError, setUploadError] = React.useState<string>('')
  const inputRef = React.useRef<HTMLInputElement>(null)

  const acceptString = accept || DEFAULT_ACCEPTED_FORMATS.join(',')
  const maxSize = maxSizeMB * 1024 * 1024 // Converter MB para bytes

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
      // Converter FileList para array
      const fileArray = Array.from(event.target.files)
      
      // Validar arquivos
      let hasError = false
      const validFiles = fileArray.filter(file => {
        // Verificar tamanho
        if (file.size > maxSize) {
          setUploadError(`Arquivo ${file.name} excede o tamanho máximo de ${maxSizeMB}MB`)
          hasError = true
          return false
        }
        
        // Verificar tipo
        const isAccepted = DEFAULT_ACCEPTED_FORMATS.some(format => 
          file.type === format || file.type.startsWith(format.split('/')[0] + '/')
        )
        if (!isAccepted) {
          setUploadError(`Formato do arquivo ${file.name} não é aceito`)
          hasError = true
          return false
        }
        
        return true
      })
      
      // Se passou pela validação
      if (!hasError) {
        setUploadError('')
        setFiles(validFiles)
        
        // Chamar callback customizado se existir
        if (onFileSelect) {
          onFileSelect(validFiles)
        }
        
        // Chamar onChange original
        if (onChange) {
          onChange(event)
        }
      }
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = () => {
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      if (inputRef.current) {
        // Simular o input change para usar o mesmo método de validação
        const dataTransfer = new DataTransfer()
        
        // Adicionar apenas um arquivo se não for multiple
        const filesToAdd = multiple 
          ? Array.from(e.dataTransfer.files)
          : [e.dataTransfer.files[0]]
          
        filesToAdd.forEach(file => dataTransfer.items.add(file))
        
        // Atribuir ao input e disparar evento de change
        inputRef.current.files = dataTransfer.files
        const event = new Event('change', { bubbles: true })
        inputRef.current.dispatchEvent(event)
      }
    }
  }

  const removeFile = (index: number) => {
    const newFiles = [...files]
    newFiles.splice(index, 1)
    setFiles(newFiles)
    
    // Atualizar o input para refletir a remoção
    if (inputRef.current) {
      const dataTransfer = new DataTransfer()
      newFiles.forEach(file => dataTransfer.items.add(file))
      inputRef.current.files = dataTransfer.files
      
      // Notificar mudança
      if (onFileSelect) {
        onFileSelect(newFiles)
      }
    }
  }

  return (
    <div className={cn("space-y-2", className)}>
      {label && (
        <Label htmlFor={props.id}>{label}</Label>
      )}
      
      <div
        className={cn(
          "border-2 border-dashed rounded-md p-4 transition-colors",
          isDragging ? "border-primary bg-primary/5" : "border-input",
          error || uploadError ? "border-destructive" : ""
        )}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <div className="flex flex-col items-center justify-center gap-2 text-center">
          <Upload className="h-8 w-8 text-muted-foreground" />
          <div>
            <p className="font-medium">
              {multiple ? 'Arraste arquivos ou' : 'Arraste um arquivo ou'}
            </p>
            <p className="text-sm text-muted-foreground">
              Clique para selecionar {multiple ? 'arquivos' : 'um arquivo'}
            </p>
          </div>
          
          <Input
            ref={inputRef}
            type="file"
            className="hidden"
            onChange={handleFileChange}
            accept={acceptString}
            multiple={multiple}
            {...props}
          />
          
          <button
            type="button"
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm hover:bg-primary/90"
            onClick={() => inputRef.current?.click()}
          >
            Selecionar {multiple ? 'arquivos' : 'arquivo'}
          </button>
          
          {helperText && !error && !uploadError && (
            <p className="text-xs text-muted-foreground">{helperText}</p>
          )}
          
          {(error || uploadError) && (
            <p className="text-xs text-destructive">
              {error || uploadError}
            </p>
          )}
        </div>
      </div>
      
      {/* Lista de arquivos selecionados */}
      {files.length > 0 && (
        <div className="space-y-2 mt-4">
          <p className="text-sm font-medium">{multiple ? 'Arquivos selecionados:' : 'Arquivo selecionado:'}</p>
          <ul className="space-y-2">
            {files.map((file, index) => (
              <li key={`${file.name}-${index}`} className="flex items-center justify-between bg-muted p-2 rounded-md text-sm">
                <div className="flex items-center gap-2">
                  <File className="h-4 w-4" />
                  <span className="truncate max-w-[200px]">{file.name}</span>
                  <span className="text-xs text-muted-foreground">
                    {(file.size / 1024 / 1024).toFixed(2)} MB
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => removeFile(index)}
                  className="text-destructive hover:text-destructive/80"
                  aria-label="Remover arquivo"
                >
                  <FileX className="h-4 w-4" />
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
} 