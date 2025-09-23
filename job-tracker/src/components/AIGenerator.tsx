import { useState } from 'react';
import { aiService } from '../services/ai';
import type { GenerationRequest } from '../services/ai';
import { FileText, Sparkles, Download, Copy } from 'lucide-react';

interface AIGeneratorProps {
  type: 'resume' | 'cover_letter';
  jobDescription?: string;
  companyName?: string;
  position?: string;
}

export function AIGenerator({ type, jobDescription = '', companyName = '', position = '' }: AIGeneratorProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedContent, setGeneratedContent] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    jobDescription,
    companyName,
    position,
    existingContent: '',
    userExperience: '',
  });

  const handleGenerate = async () => {
    if (!formData.jobDescription.trim() || !formData.companyName.trim() || !formData.position.trim()) {
      setError('Please fill in job description, company name, and position');
      return;
    }

    setIsGenerating(true);
    setError(null);
    setGeneratedContent('');

    try {
      const request: GenerationRequest = {
        type,
        jobDescription: formData.jobDescription,
        companyName: formData.companyName,
        position: formData.position,
        existingContent: formData.existingContent || undefined,
        userExperience: formData.userExperience || undefined,
      };

      const response = await aiService.generateContent(request);
      setGeneratedContent(response.content);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate content');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(generatedContent);
      // Could add a toast notification here
    } catch (err) {
      console.error('Failed to copy to clipboard:', err);
    }
  };

  const handleDownload = () => {
    const blob = new Blob([generatedContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${type === 'resume' ? 'resume' : 'cover-letter'}-${formData.companyName.toLowerCase().replace(/\s+/g, '-')}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow">
      <div className="flex items-center gap-2 mb-6">
        <Sparkles className="h-6 w-6 text-blue-600" />
        <h2 className="text-2xl font-semibold text-gray-900">
          AI {type === 'resume' ? 'Resume' : 'Cover Letter'} Generator
        </h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Input Form */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Company Name *
            </label>
            <input
              type="text"
              value={formData.companyName}
              onChange={(e) => setFormData(prev => ({ ...prev, companyName: e.target.value }))}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="e.g., Google, Microsoft"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Position *
            </label>
            <input
              type="text"
              value={formData.position}
              onChange={(e) => setFormData(prev => ({ ...prev, position: e.target.value }))}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="e.g., Senior Software Engineer"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Job Description *
            </label>
            <textarea
              value={formData.jobDescription}
              onChange={(e) => setFormData(prev => ({ ...prev, jobDescription: e.target.value }))}
              rows={6}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Paste the full job description here..."
            />
          </div>

          {type === 'resume' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Current Resume Content (Optional)
              </label>
              <textarea
                value={formData.existingContent}
                onChange={(e) => setFormData(prev => ({ ...prev, existingContent: e.target.value }))}
                rows={4}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Paste your current resume content to be formatted and optimized..."
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Additional Experience Context (Optional)
            </label>
            <textarea
              value={formData.userExperience}
              onChange={(e) => setFormData(prev => ({ ...prev, userExperience: e.target.value }))}
              rows={3}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Add any additional context about your background, achievements, or skills..."
            />
          </div>

          <button
            onClick={handleGenerate}
            disabled={isGenerating}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isGenerating ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Generating...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                Generate {type === 'resume' ? 'Resume' : 'Cover Letter'}
              </>
            )}
          </button>

          {error && (
            <div className="text-red-600 text-sm bg-red-50 border border-red-200 rounded p-3">
              {error}
            </div>
          )}
        </div>

        {/* Generated Content */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium text-gray-900">Generated Content</h3>
            {generatedContent && (
              <div className="flex gap-2">
                <button
                  onClick={handleCopy}
                  className="flex items-center gap-1 px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded"
                >
                  <Copy className="h-4 w-4" />
                  Copy
                </button>
                <button
                  onClick={handleDownload}
                  className="flex items-center gap-1 px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded"
                >
                  <Download className="h-4 w-4" />
                  Download
                </button>
              </div>
            )}
          </div>

          <div className="border border-gray-300 rounded-md p-4 min-h-[400px] bg-gray-50">
            {generatedContent ? (
              <pre className="whitespace-pre-wrap text-sm text-gray-800 font-mono">
                {generatedContent}
              </pre>
            ) : (
              <div className="flex items-center justify-center h-full text-gray-500">
                <div className="text-center">
                  <FileText className="h-12 w-12 mx-auto mb-2 text-gray-400" />
                  <p>Generated content will appear here</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
