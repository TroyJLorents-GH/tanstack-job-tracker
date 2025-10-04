// src/hooks/useDocuments.ts
import { useQuery } from '@tanstack/react-query'
import { supabase } from '../services/supabase'

type Row = {
  id: string
  user_id?: string
  file_name: string
  file_url: string // stored path: "documents/<uid>/<filename>"
  uploaded_at: string
}

export type UserDocument = Row & { url: string } // resolved signed or public URL

export function useDocuments(userId?: string) {
  return useQuery<UserDocument[]>({
    queryKey: ['documents', userId],
    enabled: !!userId,
    queryFn: async () => {
      if (!userId) return []

      // Fetch only current user’s docs; RLS will enforce user_id match
      const { data, error } = await supabase
        .from('documents')
        .select('id, user_id, file_name, file_url, uploaded_at')
        .eq('user_id', userId)
        .order('uploaded_at', { ascending: false })

      if (error) throw error
      const rows = (data ?? []) as Row[]

      // Resolve each file_url → signed or public URL
      const resolved = await Promise.all(
        rows.map(async (r) => {
          // If already full URL (public bucket case)
          if (r.file_url.startsWith('http')) {
            return { ...r, url: r.file_url }
          }

          // Expect "documents/<uid>/<filename>"
          const path = r.file_url.replace(/^documents\//, '')
          const { data: signed, error: signErr } = await supabase
            .storage
            .from('documents')
            .createSignedUrl(path, 60 * 60) // 1 hour

          return {
            ...r,
            url: signErr || !signed ? '' : signed.signedUrl,
          }
        })
      )

      return resolved
    },
  })
}
