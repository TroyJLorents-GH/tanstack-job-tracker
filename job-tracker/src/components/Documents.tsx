import { useEffect, useState } from 'react';
import { supabase, isSupabaseConfigured } from '../services/supabase';
import { Upload, FileText, Trash2, Sparkles } from 'lucide-react';
import { AIGenerator } from './AIGenerator';

type StoredFile = {
  name: string;
  url: string;
};

export function Documents() {
  const [files, setFiles] = useState<StoredFile[]>([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'files' | 'resume' | 'cover-letter'>('files');

  const bucket = 'documents';

  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) return;
    (async () => {
      const client = supabase as NonNullable<typeof supabase>;
      const { data } = await client.storage.from(bucket).list(undefined, { limit: 100, offset: 0 });
      if (!data) return;
      const withUrls: StoredFile[] = await Promise.all(
        data.map(async (f) => {
          const { data: url } = client.storage.from(bucket).getPublicUrl(f.name);
          return { name: f.name, url: url.publicUrl };
        })
      );
      setFiles(withUrls);
    })();
  }, []);

  const onUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!isSupabaseConfigured || !supabase) {
      setError('Storage not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.');
      return;
    }
    setError(null);
    setUploading(true);
    const fileName = `${Date.now()}-${file.name}`;
    const client = supabase as NonNullable<typeof supabase>;
    const { error: upErr } = await client.storage.from(bucket).upload(fileName, file, {
      cacheControl: '3600',
      upsert: false,
    });
    setUploading(false);
    if (upErr) {
      setError(upErr.message);
      return;
    }
    const { data } = client.storage.from(bucket).getPublicUrl(fileName);
    setFiles((prev) => [{ name: fileName, url: data.publicUrl }, ...prev]);
  };

  const onDelete = async (name: string) => {
    if (!isSupabaseConfigured || !supabase) return;
    const client = supabase as NonNullable<typeof supabase>;
    const { error: delErr } = await client.storage.from(bucket).remove([name]);
    if (delErr) {
      setError(delErr.message);
      return;
    }
    setFiles((prev) => prev.filter((f) => f.name !== name));
  };

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
                <FileText className="h-4 w-4 inline mr-1" />
                Files
              </button>
              <button
                onClick={() => setActiveTab('resume')}
                className={`px-3 py-1 rounded text-sm font-medium ${
                  activeTab === 'resume' ? 'bg-white text-gray-900 shadow' : 'text-gray-600'
                }`}
              >
                <Sparkles className="h-4 w-4 inline mr-1" />
                Resume AI
              </button>
              <button
                onClick={() => setActiveTab('cover-letter')}
                className={`px-3 py-1 rounded text-sm font-medium ${
                  activeTab === 'cover-letter' ? 'bg-white text-gray-900 shadow' : 'text-gray-600'
                }`}
              >
                <Sparkles className="h-4 w-4 inline mr-1" />
                Cover Letter AI
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

        {!isSupabaseConfigured && (
          <div className="mb-4 text-yellow-800 bg-yellow-50 border border-yellow-200 rounded p-3">
            Storage is not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY and create a
            public bucket named "documents" in Supabase.
          </div>
        )}

        {error && (
          <div className="mb-4 text-red-700 bg-red-50 border border-red-200 rounded p-3">{error}</div>
        )}

        {/* Tab Content */}
        {activeTab === 'files' && (
          <ul className="divide-y divide-gray-200 bg-white rounded-md shadow">
            {files.length === 0 && (
              <li className="p-4 text-gray-500">No documents uploaded yet.</li>
            )}
            {files.map((f) => (
              <li key={f.name} className="p-4 flex items-center justify-between">
                <a href={f.url} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-blue-600 hover:text-blue-800">
                  <FileText className="h-5 w-5" />
                  <span className="truncate max-w-xs sm:max-w-md">{f.name}</span>
                </a>
                <button
                  className="text-red-600 hover:text-red-800 inline-flex items-center gap-1"
                  onClick={() => onDelete(f.name)}
                >
                  <Trash2 className="h-4 w-4" /> Delete
                </button>
              </li>
            ))}
          </ul>
        )}

        {activeTab === 'resume' && (
          <AIGenerator type="resume" />
        )}

        {activeTab === 'cover-letter' && (
          <AIGenerator type="cover_letter" />
        )}
      </div>
    </div>
  );
}


