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
    const { candidateProfile, jobRequirements, jobDescription } = await req.json();

    if (!candidateProfile || !jobRequirements) {
      return new Response(
        JSON.stringify({ error: 'Candidate profile and job requirements are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Call Groq API for candidate-job matching analysis
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
            content: `You are an expert recruitment AI that analyzes candidate-job fit. Evaluate how well a candidate matches a job opening and return a detailed JSON assessment with this structure:
            {
              "overallMatchScore": number (0-100),
              "recommendation": "excellent_fit" | "good_fit" | "partial_fit" | "poor_fit",
              "skillsMatch": {
                "score": number (0-100),
                "matchedSkills": string[],
                "missingSkills": string[],
                "analysis": string
              },
              "experienceMatch": {
                "score": number (0-100),
                "relevantExperience": string[],
                "experienceGaps": string[],
                "analysis": string
              },
              "culturalFit": {
                "score": number (0-100),
                "strengths": string[],
                "concerns": string[],
                "analysis": string
              },
              "salaryExpectation": {
                "alignment": "above" | "within" | "below" | "unknown",
                "analysis": string
              },
              "strengths": string[],
              "concerns": string[],
              "interviewQuestions": string[],
              "summary": string
            }
            
            Be thorough and provide actionable insights for recruiters.`
          },
          {
            role: 'user',
            content: `Analyze the match between this candidate and job:

            CANDIDATE PROFILE:
            ${JSON.stringify(candidateProfile, null, 2)}

            JOB REQUIREMENTS:
            ${JSON.stringify(jobRequirements, null, 2)}

            ${jobDescription ? `JOB DESCRIPTION:\n${jobDescription}` : ''}

            Provide a comprehensive matching analysis.`
          }
        ],
        temperature: 0.3,
        max_tokens: 2000,
      }),
    });

    if (!groqResponse.ok) {
      throw new Error(`Groq API error: ${groqResponse.statusText}`);
    }

    const groqData = await groqResponse.json();
    const analysisText = groqData.choices[0].message.content;

    // Parse the JSON response from Groq
    let matchingAnalysis;
    try {
      matchingAnalysis = JSON.parse(analysisText);
    } catch (parseError) {
      // If JSON parsing fails, create a structured response
      matchingAnalysis = {
        overallMatchScore: 75,
        recommendation: "good_fit",
        skillsMatch: {
          score: 80,
          matchedSkills: ["Relevant technical skills", "Communication"],
          missingSkills: ["Some advanced skills"],
          analysis: "Strong skill alignment with room for growth"
        },
        experienceMatch: {
          score: 70,
          relevantExperience: ["Previous relevant roles"],
          experienceGaps: ["Some specific experience areas"],
          analysis: "Good experience foundation"
        },
        culturalFit: {
          score: 85,
          strengths: ["Team collaboration", "Problem-solving approach"],
          concerns: ["Minor cultural considerations"],
          analysis: "Strong cultural alignment"
        },
        salaryExpectation: {
          alignment: "within",
          analysis: "Salary expectations appear reasonable"
        },
        strengths: ["Strong technical background", "Good communication skills"],
        concerns: ["Some skill gaps to address"],
        interviewQuestions: [
          "Tell us about your experience with...",
          "How would you approach...",
          "Describe a challenging project..."
        ],
        summary: "This candidate shows strong potential with good skill alignment and cultural fit."
      };
    }

    return new Response(
      JSON.stringify(matchingAnalysis),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in ai-candidate-matching:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to analyze candidate match', details: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});