import { useEffect, useMemo, useState } from 'react'
import { Upload, FileText, Trash2, Sparkles } from 'lucide-react'
import { useAuth } from '../context/AuthProvider'
import { supabase, isSupabaseConfigured } from '../services/supabase'
import { useDocuments } from '../hooks/useDocuments'
import { AIGenerator } from './AIGenerator'
import { useSearch } from '@tanstack/react-router'

export function Documents() {
  const { user } = useAuth()
  const { data: files = [], refetch } = useDocuments(user?.id)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'files' | 'resume' | 'cover-letter'>('files')
  const [extractingId, setExtractingId] = useState<string | null>(null)
  const [aiUserExperience, setAiUserExperience] = useState<string>('')
  const bucket = 'documents'

  // Read deep-link params to prefill AI
  const search = useSearch({ from: '/documents' }) as {
    ai?: 'resume' | 'cover_letter'
    companyName?: string
    position?: string
    jobDescription?: string
  }
  const initialTab = useMemo(() => {
    if (search?.ai === 'resume') return 'resume'
    if (search?.ai === 'cover_letter') return 'cover-letter'
    return 'files'
  }, [search])
  useEffect(() => {
    setActiveTab(initialTab)
  }, [initialTab])

  // UPLOAD
  const onUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!user) return setError('Please sign in to upload files.')
    if (!isSupabaseConfigured || !supabase) return setError('Storage not configured.')

    setUploading(true)
    setError(null)

    const fileName = `${Date.now()}-${file.name}`
    const path = `${user.id}/${fileName}`

    // 1️⃣ Upload to storage
    const { error: uploadErr } = await supabase.storage.from(bucket).upload(path, file, {
      cacheControl: '3600',
      upsert: false,
    })
    if (uploadErr) {
      setError(uploadErr.message)
      setUploading(false)
      return
    }

    // 2️⃣ Store metadata in public.documents
    const file_url = `documents/${path}`
    const { error: insertErr } = await supabase
      .from('documents')
      .insert([{ user_id: user.id, file_name: fileName, file_url }])

    if (insertErr) setError(insertErr.message)

    setUploading(false)
    refetch()
  }

  // DELETE
  const onDelete = async (docId: string, fileName: string) => {
    if (!user || !isSupabaseConfigured || !supabase) return
    const path = `${user.id}/${fileName}`

    const { error: delErr } = await supabase.storage.from(bucket).remove([path])
    if (delErr) return setError(delErr.message)

    await supabase.from('documents').delete().eq('id', docId)
    refetch()
  }

  return (
    <div className="px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-semibold text-gray-900">Documents & AI Tools</h1>
          <div className="flex items-center gap-4">
            <div className="flex bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setActiveTab('files')}
                className={`px-3 py-1 rounded text-sm font-medium ${
                  activeTab === 'files' ? 'bg-white text-gray-900 shadow' : 'text-gray-600'
                }`}
              >
                <FileText className="h-4 w-4 inline mr-1" /> Files
              </button>
              <button
                onClick={() => setActiveTab('resume')}
                className={`px-3 py-1 rounded text-sm font-medium ${
                  activeTab === 'resume' ? 'bg-white text-gray-900 shadow' : 'text-gray-600'
                }`}
              >
                <Sparkles className="h-4 w-4 inline mr-1" /> Resume AI
              </button>
              <button
                onClick={() => setActiveTab('cover-letter')}
                className={`px-3 py-1 rounded text-sm font-medium ${
                  activeTab === 'cover-letter' ? 'bg-white text-gray-900 shadow' : 'text-gray-600'
                }`}
              >
                <Sparkles className="h-4 w-4 inline mr-1" /> Cover Letter AI
              </button>
            </div>

            {activeTab === 'files' && (
              <label className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md cursor-pointer hover:bg-blue-700">
                <Upload className="h-4 w-4" />
                <span>{uploading ? 'Uploading...' : 'Upload'}</span>
                <input type="file" className="hidden" onChange={onUpload} accept=".pdf,.doc,.docx,.txt" />
              </label>
            )}
          </div>
        </div>

        {error && <div className="mb-4 text-red-700 bg-red-50 border border-red-200 rounded p-3">{error}</div>}

        {activeTab === 'files' && (
          <ul className="divide-y divide-gray-200 bg-white rounded-md shadow">
            {(!user || files.length === 0) && (
              <li className="p-4 text-gray-500">
                {user ? 'No documents uploaded yet.' : 'Please sign in to view your documents.'}
              </li>
            )}
            {files.map((f) => (
              <li key={f.id} className="p-4 flex items-center justify-between">
                <a
                  href={f.url}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-2 text-blue-600 hover:text-blue-800"
                >
                  <FileText className="h-5 w-5" />
                  <span className="truncate max-w-xs sm:max-w-md">{f.file_name}</span>
                </a>
                <button
                  className="text-red-600 hover:text-red-800 inline-flex items-center gap-1"
                  onClick={() => onDelete(f.id, f.file_name)}
                >
                  <Trash2 className="h-4 w-4" /> Delete
                </button>
              </li>
            ))}
          </ul>
        )}

        {activeTab === 'resume' && (
          <AIGenerator
            type="resume"
            companyName={search?.companyName || ''}
            position={search?.position || ''}
            jobDescription={search?.jobDescription || ''}
            initialUserExperience={aiUserExperience}
          />
        )}
        {activeTab === 'cover-letter' && (
          <AIGenerator
            type="cover_letter"
            companyName={search?.companyName || ''}
            position={search?.position || ''}
            jobDescription={search?.jobDescription || ''}
            initialUserExperience={aiUserExperience}
          />
        )}

        {(activeTab === 'resume' || activeTab === 'cover-letter') && (
          <div className="mt-6 bg-white rounded-md shadow p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-gray-800">Use an uploaded document as context</h3>
              {extractingId && <span className="text-xs text-gray-500">Extracting…</span>}
            </div>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {files
                .filter((f) => /\.(pdf|docx|txt|md)$/i.test(f.file_name))
                .map((f) => (
                  <button
                    key={f.id}
                    disabled={!!extractingId}
                    onClick={async () => {
                      try {
                        setError(null)
                        setExtractingId(f.id)
                        const resp = await fetch(f.url)
                        const blob = await resp.blob()
                        const form = new FormData()
                        // File constructor is supported in modern browsers
                        form.append('file', new File([blob], f.file_name))
                        const base = (import.meta as any).env?.VITE_PARSE_API_URL as string
                        const apiBase = base?.replace(/\/$/, '')
                        const extResp = await fetch(`${apiBase}/extract-text`, { method: 'POST', body: form })
                        if (!extResp.ok) {
                          const msg = await extResp.text()
                          throw new Error(msg || 'Failed to extract text')
                        }
                        const data = await extResp.json()
                        setAiUserExperience(data.text || '')
                      } catch (e: any) {
                        setError(e?.message || 'Failed to use this document')
                      } finally {
                        setExtractingId(null)
                      }
                    }}
                    className={`text-left border rounded p-3 hover:bg-gray-50 disabled:opacity-50`}
                  >
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-gray-600" />
                      <span className="truncate">{f.file_name}</span>
                    </div>
                    <div className="mt-1 text-xs text-gray-500">Click to use as AI context</div>
                  </button>
                ))}
              {files.filter((f) => /\.(pdf|docx|txt|md)$/i.test(f.file_name)).length === 0 && (
                <div className="text-sm text-gray-500">No supported files yet. Upload a .pdf, .docx, or .txt file in the Files tab.</div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}


// import { useEffect, useState } from 'react';
// import { supabase, isSupabaseConfigured } from '../services/supabase';
// import { Upload, FileText, Trash2, Sparkles } from 'lucide-react';
// import { AIGenerator } from './AIGenerator';
// import { useAuth } from '../context/AuthProvider';

// type StoredFile = {
//   name: string;
//   url: string;
// };

// export function Documents() {
//   const [files, setFiles] = useState<StoredFile[]>([]);
//   const [uploading, setUploading] = useState(false);
//   const [error, setError] = useState<string | null>(null);
//   const [activeTab, setActiveTab] = useState<'files' | 'resume' | 'cover-letter'>('files');
//   const { user, isEnabled } = useAuth();

//   const bucket = 'documents';

//   useEffect(() => {
//   if (!isSupabaseConfigured || !supabase) return;
//     (async () => {
//       const client = supabase!;
//       const { data, error } = await client
//         .storage
//         .from(bucket)
//         .list('', { limit: 100, offset: 0 }); // use '' rather than undefined

//       if (error || !data) return;

//       const withUrls = data.map(f => {
//         const { data: url } = client.storage.from(bucket).getPublicUrl(f.name);
//         return { name: f.name, url: url.publicUrl };
//       });
//       setFiles(withUrls);
//     })();
//   }, [isSupabaseConfigured, supabase]);

//   const onUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
//     const file = e.target.files?.[0];
//     if (!file) return;

//     if (!isEnabled || !supabase) {
//       setError('Storage not configured.');
//       return;
//     }
//     if (!user) { // NEW: require login to write
//       setError('Please sign in to upload files.');
//       return;
//     }

//     if (!isSupabaseConfigured || !supabase) {
//       setError('Storage not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.');
//       return;
//     }
//     setError(null);
//     setUploading(true);
//     const fileName = `${Date.now()}-${file.name}`;
//     const client = supabase as NonNullable<typeof supabase>;
//     const { error: upErr } = await client.storage.from(bucket).upload(fileName, file, {
//       cacheControl: '3600',
//       upsert: false,
//     });
//     setUploading(false);
//     if (upErr) {
//       setError(upErr.message);
//       return;
//     }
//     const { data } = client.storage.from(bucket).getPublicUrl(fileName);
//     setFiles((prev) => [{ name: fileName, url: data.publicUrl }, ...prev]);
//   };

//   const onDelete = async (name: string) => {
//     if (!isSupabaseConfigured || !supabase) { 
//       setError('Storage not configured.'); 
//       return; };
//     if (!user) {
//       setError('Please sign in to delete files.');
//       return;
//     }
//     const client = supabase as NonNullable<typeof supabase>;
//     const { error: delErr } = await client.storage.from(bucket).remove([name]);
//     if (delErr) {
//       setError(delErr.message);
//       return;
//     }
//     setFiles((prev) => prev.filter((f) => f.name !== name));
//   };

//   return (
//     <div className="px-4 sm:px-6 lg:px-8">
//       <div className="max-w-6xl mx-auto">
//         <div className="flex items-center justify-between mb-6">
//           <h1 className="text-2xl font-semibold text-gray-900">Documents & AI Tools</h1>
//           <div className="flex items-center gap-4">
//             <div className="flex bg-gray-100 rounded-lg p-1">
//               <button
//                 onClick={() => setActiveTab('files')}
//                 className={`px-3 py-1 rounded text-sm font-medium ${
//                   activeTab === 'files' ? 'bg-white text-gray-900 shadow' : 'text-gray-600'
//                 }`}
//               >
//                 <FileText className="h-4 w-4 inline mr-1" />
//                 Files
//               </button>
//               <button
//                 onClick={() => setActiveTab('resume')}
//                 className={`px-3 py-1 rounded text-sm font-medium ${
//                   activeTab === 'resume' ? 'bg-white text-gray-900 shadow' : 'text-gray-600'
//                 }`}
//               >
//                 <Sparkles className="h-4 w-4 inline mr-1" />
//                 Resume AI
//               </button>
//               <button
//                 onClick={() => setActiveTab('cover-letter')}
//                 className={`px-3 py-1 rounded text-sm font-medium ${
//                   activeTab === 'cover-letter' ? 'bg-white text-gray-900 shadow' : 'text-gray-600'
//                 }`}
//               >
//                 <Sparkles className="h-4 w-4 inline mr-1" />
//                 Cover Letter AI
//               </button>
//             </div>
//             {activeTab === 'files' && (
//               <label className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md cursor-pointer hover:bg-blue-700">
//                 <Upload className="h-4 w-4" />
//                 <span>{uploading ? 'Uploading...' : 'Upload'}</span>
//                 <input type="file" className="hidden" onChange={onUpload} accept=".pdf,.doc,.docx,.txt" />
//               </label>
//             )}
//           </div>
//         </div>

//         {!isSupabaseConfigured && (
//           <div className="mb-4 text-yellow-800 bg-yellow-50 border border-yellow-200 rounded p-3">
//             Storage is not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY and create a
//             public bucket named "documents" in Supabase.
//           </div>
//         )}

//         {error && (
//           <div className="mb-4 text-red-700 bg-red-50 border border-red-200 rounded p-3">{error}</div>
//         )}

//         {/* Tab Content */}
//         {activeTab === 'files' && (
//           <ul className="divide-y divide-gray-200 bg-white rounded-md shadow">
//             {files.length === 0 && (
//               <li className="p-4 text-gray-500">No documents uploaded yet.</li>
//             )}
//             {files.map((f) => (
//               <li key={f.name} className="p-4 flex items-center justify-between">
//                 <a href={f.url} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-blue-600 hover:text-blue-800">
//                   <FileText className="h-5 w-5" />
//                   <span className="truncate max-w-xs sm:max-w-md">{f.name}</span>
//                 </a>
//                 <button
//                   className="text-red-600 hover:text-red-800 inline-flex items-center gap-1"
//                   onClick={() => onDelete(f.name)}
//                 >
//                   <Trash2 className="h-4 w-4" /> Delete
//                 </button>
//               </li>
//             ))}
//           </ul>
//         )}

//         {activeTab === 'resume' && (
//           <AIGenerator type="resume" />
//         )}

//         {activeTab === 'cover-letter' && (
//           <AIGenerator type="cover_letter" />
//         )}
//       </div>
//     </div>
//   );
// }


