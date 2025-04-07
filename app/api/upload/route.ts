import { NextRequest, NextResponse } from 'next/server'
import { uploadToGoogleDrive } from '@/lib/drive-service' // Caminho ajustado para /lib
import { randomUUID } from 'crypto'

// Configurações (poderiam vir de variáveis de ambiente)
const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB
const ACCEPTED_FILE_TYPES = ['image/jpeg', 'image/png', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      return NextResponse.json({ error: 'Nenhum arquivo enviado' }, { status: 400 })
    }

    console.log(`[Upload API] Recebido arquivo: ${file.name}, Tamanho: ${file.size}, Tipo: ${file.type}`)

    // Validar tamanho do arquivo
    if (file.size > MAX_FILE_SIZE) {
      console.log('[Upload API] Arquivo muito grande')
      return NextResponse.json({ error: `Arquivo excede o tamanho máximo de ${MAX_FILE_SIZE / 1024 / 1024}MB` }, { status: 413 })
    }

    // Validar tipo do arquivo
    if (!ACCEPTED_FILE_TYPES.includes(file.type)) {
      console.log('[Upload API] Tipo de arquivo não suportado')
      return NextResponse.json({ error: 'Tipo de arquivo não suportado' }, { status: 415 })
    }

    // Ler o buffer do arquivo
    const fileBuffer = Buffer.from(await file.arrayBuffer())

    // Gerar um nome único para o arquivo (ex: UUID + extensão original)
    const fileExtension = file.name.split('.').pop()
    const uniqueFileName = `${randomUUID()}.${fileExtension}`

    // Fazer upload para o Google Drive
    const driveFile = await uploadToGoogleDrive(fileBuffer, uniqueFileName, file.type)

    if (!driveFile) {
      console.log('[Upload API] Falha no upload para o Google Drive')
      return NextResponse.json({ error: 'Falha ao fazer upload do arquivo' }, { status: 500 })
    }

    console.log('[Upload API] Upload bem-sucedido')

    // Retornar informações do arquivo no Drive (ID, nome, link de visualização, etc.)
    return NextResponse.json({ 
      success: true, 
      fileInfo: {
        id: driveFile.id,
        name: driveFile.name,
        webViewLink: driveFile.webViewLink, // Link para visualizar no Drive
        webContentLink: driveFile.webContentLink // Link para download direto (pode exigir permissão)
      }
    }, { status: 201 })

  } catch (error) {
    console.error('[Upload API] Erro ao processar upload:', error)
    return NextResponse.json({ error: 'Erro interno ao processar o arquivo' }, { status: 500 })
  }
} 