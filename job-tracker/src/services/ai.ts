// AI service for resume/cover letter generation
// Supports multiple providers: OpenAI, Anthropic, or local fallback

export type AIProvider = 'openai' | 'anthropic' | 'local';

export interface AIConfig {
  provider: AIProvider;
  apiKey?: string;
  model?: string;
}

export interface GenerationRequest {
  type: 'resume' | 'cover_letter';
  jobDescription: string;
  companyName: string;
  position: string;
  existingContent?: string; // For resume formatting or cover letter base
  userExperience?: string; // Additional context about user's background
}

export interface GenerationResponse {
  content: string;
  provider: AIProvider;
  model?: string;
  tokensUsed?: number;
}

class AIService {
  private config: AIConfig;

  constructor(config: AIConfig) {
    this.config = config;
  }

  async generateContent(request: GenerationRequest): Promise<GenerationResponse> {
    switch (this.config.provider) {
      case 'openai':
        return this.generateWithOpenAI(request);
      case 'anthropic':
        return this.generateWithAnthropic(request);
      case 'local':
      default:
        return this.generateLocal(request);
    }
  }

  private async generateWithOpenAI(request: GenerationRequest): Promise<GenerationResponse> {
    if (!this.config.apiKey) {
      throw new Error('OpenAI API key not configured');
    }

    const prompt = this.buildPrompt(request);
    
    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: this.config.model || 'gpt-4',
          messages: [
            {
              role: 'system',
              content: 'You are a professional career coach and resume writer. Generate high-quality, tailored content that matches the job requirements.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          max_tokens: 2000,
          temperature: 0.7,
        }),
      });

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.statusText}`);
      }

      const data = await response.json();
      return {
        content: data.choices[0].message.content,
        provider: 'openai',
        model: this.config.model || 'gpt-4',
        tokensUsed: data.usage?.total_tokens,
      };
    } catch (error) {
      console.error('OpenAI generation failed:', error);
      throw new Error('Failed to generate content with OpenAI');
    }
  }

  private async generateWithAnthropic(request: GenerationRequest): Promise<GenerationResponse> {
    if (!this.config.apiKey) {
      throw new Error('Anthropic API key not configured');
    }

    const prompt = this.buildPrompt(request);
    
    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'x-api-key': this.config.apiKey,
          'Content-Type': 'application/json',
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: this.config.model || 'claude-3-sonnet-20240229',
          max_tokens: 2000,
          messages: [
            {
              role: 'user',
              content: prompt
            }
          ],
        }),
      });

      if (!response.ok) {
        throw new Error(`Anthropic API error: ${response.statusText}`);
      }

      const data = await response.json();
      return {
        content: data.content[0].text,
        provider: 'anthropic',
        model: this.config.model || 'claude-3-sonnet-20240229',
        tokensUsed: data.usage?.input_tokens + data.usage?.output_tokens,
      };
    } catch (error) {
      console.error('Anthropic generation failed:', error);
      throw new Error('Failed to generate content with Anthropic');
    }
  }

  private async generateLocal(request: GenerationRequest): Promise<GenerationResponse> {
    // Simulate AI generation with a delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const content = this.generateMockContent(request);
    
    return {
      content,
      provider: 'local',
      model: 'mock-ai',
    };
  }

  private buildPrompt(request: GenerationRequest): string {
    const { type, jobDescription, companyName, position, existingContent, userExperience } = request;
    
    if (type === 'resume') {
      return `Please format and optimize this resume for the ${position} position at ${companyName}.

Job Description:
${jobDescription}

${existingContent ? `Current Resume Content:
${existingContent}` : ''}

${userExperience ? `Additional Experience Context:
${userExperience}` : ''}

Please:
1. Tailor the resume to match the job requirements
2. Use relevant keywords from the job description
3. Highlight relevant experience and skills
4. Maintain professional formatting
5. Keep it concise and impactful

Return only the formatted resume content.`;
    } else {
      return `Please write a compelling cover letter for the ${position} position at ${companyName}.

Job Description:
${jobDescription}

${existingContent ? `Base Cover Letter Content:
${existingContent}` : ''}

${userExperience ? `My Background:
${userExperience}` : ''}

Please:
1. Address the specific requirements mentioned in the job description
2. Show enthusiasm for the company and role
3. Highlight relevant experience and achievements
4. Keep it professional but engaging
5. End with a strong call to action

Return only the cover letter content.`;
    }
  }

  private generateMockContent(request: GenerationRequest): string {
    const { type, companyName, position } = request;
    
    if (type === 'resume') {
      return `# Professional Resume

## Contact Information
[Your Name]
[Your Email] | [Your Phone] | [Your Location]
[LinkedIn Profile] | [Portfolio Website]

## Professional Summary
Experienced professional with a strong background in [relevant field]. Proven track record of [key achievements]. Seeking to leverage skills and experience in the ${position} role at ${companyName}.

## Work Experience

### [Most Recent Job Title]
[Company Name] | [Dates]
- [Key achievement 1]
- [Key achievement 2]
- [Key achievement 3]

### [Previous Job Title]
[Company Name] | [Dates]
- [Key achievement 1]
- [Key achievement 2]

## Education
[Degree] in [Field of Study]
[University Name] | [Graduation Year]

## Skills
- [Relevant skill 1]
- [Relevant skill 2]
- [Relevant skill 3]
- [Relevant skill 4]

## Certifications
- [Certification 1]
- [Certification 2]

*This is a mock resume generated for demonstration. Please customize with your actual information.*`;
    } else {
      return `[Your Name]
[Your Address]
[Your Email] | [Your Phone]
[Date]

Hiring Manager
${companyName}
[Company Address]

Dear Hiring Manager,

I am writing to express my strong interest in the ${position} position at ${companyName}. With my background in [relevant field] and passion for [relevant area], I am excited about the opportunity to contribute to your team.

In my current role as [Current Position] at [Current Company], I have successfully [key achievement]. This experience has equipped me with the skills and knowledge that align perfectly with the requirements outlined in your job posting.

What particularly attracts me to ${companyName} is [specific reason related to company]. I am impressed by [company achievement or value] and would be thrilled to be part of such an innovative organization.

I am confident that my skills in [relevant skills] and my proven ability to [key capability] make me an ideal candidate for this position. I would welcome the opportunity to discuss how my experience and enthusiasm can contribute to ${companyName}'s continued success.

Thank you for considering my application. I look forward to hearing from you soon.

Sincerely,
[Your Name]

*This is a mock cover letter generated for demonstration. Please customize with your actual information.*`;
    }
  }
}

// Factory function to create AI service instance
export function createAIService(): AIService {
  const provider = (import.meta.env.VITE_AI_PROVIDER as AIProvider) || 'local';
  const apiKey = import.meta.env.VITE_AI_API_KEY;
  const model = import.meta.env.VITE_AI_MODEL;

  return new AIService({
    provider,
    apiKey,
    model,
  });
}

// Export singleton instance
export const aiService = createAIService();
