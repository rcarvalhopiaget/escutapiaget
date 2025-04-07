import { google, Auth } from 'googleapis'

// Verificar se estamos no navegador
const isBrowser = typeof window !== 'undefined'

// Configurar autenticação OAuth2 (Valores virão do .env.local)
function getOAuth2Client(): Auth.OAuth2Client {
  if (isBrowser) {
    throw new Error('Esta função só pode ser executada no servidor')
  }

  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  )

  // IMPORTANTE: O refresh token precisa ser obtido e armazenado de forma segura
  // após o primeiro fluxo de autorização do usuário.
  if (process.env.GOOGLE_REFRESH_TOKEN) {
    oauth2Client.setCredentials({
      refresh_token: process.env.GOOGLE_REFRESH_TOKEN,
    })
  } else {
    console.warn('[Drive Service] Refresh Token do Google não configurado.')
    // Aqui você pode lançar um erro ou lidar com a ausência do token
    // throw new Error('Refresh Token do Google não configurado.')
  }

  return oauth2Client
}

/**
 * Faz upload de um arquivo para uma pasta específica no Google Drive.
 * @param fileBuffer Buffer do arquivo.
 * @param fileName Nome do arquivo no Google Drive.
 * @param mimeType Tipo MIME do arquivo (ex: 'image/jpeg', 'application/pdf').
 * @returns Objeto com informações do arquivo criado no Drive ou null em caso de erro.
 */
export async function uploadToGoogleDrive(
  fileBuffer: Buffer,
  fileName: string,
  mimeType: string
): Promise<any> {
  if (isBrowser) {
    throw new Error('Esta função só pode ser executada no servidor')
  }

  try {
    // Importação dinâmica apenas no servidor
    const { Readable } = await import('stream')
    
    const auth = getOAuth2Client()
    const drive = google.drive({ version: 'v3', auth })
    const folderId = process.env.GOOGLE_DRIVE_FOLDER_ID

    if (!folderId) {
      console.error('[Drive Service] GOOGLE_DRIVE_FOLDER_ID não configurado.')
      return null
    }

    // Criar um stream legível a partir do buffer
    const fileStream = Readable.from(fileBuffer)

    console.log(`[Drive Service] Iniciando upload de ${fileName} para a pasta ${folderId}`)

    const response = await drive.files.create({
      requestBody: {
        name: fileName,
        mimeType: mimeType,
        parents: [folderId],
      },
      media: {
        mimeType: mimeType,
        body: fileStream,
      },
      fields: 'id, name, webViewLink, webContentLink', // Campos a retornar
    })

    console.log(`[Drive Service] Upload de ${fileName} concluído. ID: ${response.data.id}`)
    return response.data

  } catch (error: unknown) {
    console.error('[Drive Service] Erro ao fazer upload para o Google Drive:', error)
    // Tratar erros específicos da API do Google, se necessário
    // if (error.code === 401) { ... } // Ex: Token inválido
    return null
  }
}

// Função para obter a URL de autorização OAuth2 do Google
export async function getGoogleAuthUrl(): Promise<string> {
  // Esta função deve ser chamada apenas do servidor
  // Criar um API Route para gerar essa URL
  if (isBrowser) {
    throw new Error('Esta função não deve ser chamada diretamente do navegador')
  }

  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  )

  // Escopos necessários: drive.file permite criar/gerenciar arquivos criados pelo app
  const scopes = ['https://www.googleapis.com/auth/drive.file']

  const url = oauth2Client.generateAuthUrl({
    access_type: 'offline', // Necessário para obter o refresh_token
    scope: scopes,
    // Opcional: adicionar um parâmetro 'state' para segurança ou para passar dados
    // state: 'algumValorParaVerificarNoCallback' 
  })

  return url
}

// TODO: Implementar função para obter tokens a partir do código de autorização
// Esta funcionalidade já está implementada na rota de callback
// export async function getGoogleTokensFromCode(code: string): Promise<any> { ... } 