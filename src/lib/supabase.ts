import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export async function uploadFile(file: File, folder: string = 'sermons') {
  const fileExt = file.name.split('.').pop()
  const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`
  const filePath = `${folder}/${fileName}`

  // NOME CORRETO DO BUCKET: 'sermons-media' (SEM ACENTO, MINÚSCULO!)
  const { data, error } = await supabase.storage
    .from('sermons-media')
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: false
    })

  if (error) {
    throw new Error(`Erro no upload: ${error.message}`)
  }

  const { data: urlData } = supabase.storage
    .from('sermons-media')
    .getPublicUrl(filePath)

  return {
    path: filePath,
    url: urlData.publicUrl
  }
}