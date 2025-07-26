import { serve } from "https://deno.land/std@0.177.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { jobTitle, company, basicRequirements } = await req.json();

    if (!jobTitle) {
      return new Response(
        JSON.stringify({ error: 'Job title is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Call Groq API for job description generation
    const groqResponse = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('GROQ_API_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.1-70b-versatile',
        messages: [
          {
            role: 'system',
            content: `You are an expert HR professional and job description writer. Create a comprehensive, engaging job posting that attracts top talent. Return a JSON object with this exact structure:
            {
              "description": "A compelling 2-3 paragraph job description that sells the role and company",
              "requirements": [
                "List of 5-8 specific requirements",
                "Include both technical and soft skills",
                "Be specific but not overly restrictive"
              ],
              "skills": [
                "List of 8-12 relevant skills",
                "Mix of technical and soft skills",
                "Industry-relevant keywords"
              ],
              "benefits": [
                "List of 4-6 attractive benefits",
                "Include both compensation and culture benefits"
              ]
            }
            
            Make it professional, engaging, and tailored to attract the right candidates.`
          },
          {
            role: 'user',
            content: `Create a job posting for:
            Job Title: ${jobTitle}
            ${company ? `Company: ${company}` : ''}
            ${basicRequirements ? `Additional Requirements: ${basicRequirements}` : ''}
            
            Make it compelling and professional.`
          }
        ],
        temperature: 0.7,
        max_tokens: 1500,
      }),
    });

    if (!groqResponse.ok) {
      throw new Error(`Groq API error: ${groqResponse.statusText}`);
    }

    const groqData = await groqResponse.json();
    const generatedText = groqData.choices[0].message.content;

    // Parse the JSON response from Groq
    let jobData;
    try {
      jobData = JSON.parse(generatedText);
    } catch (parseError) {
      // If JSON parsing fails, create a structured response
      jobData = {
        description: `We are seeking a talented ${jobTitle} to join our dynamic team. This role offers an exciting opportunity to work on challenging projects and contribute to our company's growth. The ideal candidate will bring expertise, creativity, and a passion for excellence to drive our mission forward.`,
        requirements: [
          "Bachelor's degree in relevant field or equivalent experience",
          "3+ years of relevant professional experience",
          "Strong problem-solving and analytical skills",
          "Excellent communication and teamwork abilities",
          "Proficiency in relevant tools and technologies"
        ],
        skills: [
          "Technical expertise",
          "Problem-solving",
          "Communication",
          "Teamwork",
          "Leadership",
          "Project management",
          "Analytical thinking",
          "Adaptability"
        ],
        benefits: [
          "Competitive salary and equity package",
          "Comprehensive health, dental, and vision insurance",
          "Flexible work arrangements and remote options",
          "Professional development opportunities",
          "Collaborative and innovative work environment"
        ]
      };
    }

    return new Response(
      JSON.stringify(jobData),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in ai-job-generator:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to generate job posting', details: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});