import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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
    const { candidateEmail, candidateName, interviewDate, interviewTime, interviewType, jobTitle, companyName } = await req.json();

    if (!candidateEmail || !candidateName || !interviewDate || !interviewTime) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Generate professional email content using Groq
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
            content: `You are a professional HR coordinator writing interview confirmation emails. Create a warm, professional email that includes all the important details and makes the candidate feel valued. Return only the email content in HTML format, ready to send.`
          },
          {
            role: 'user',
            content: `Create an interview confirmation email with these details:
            - Candidate: ${candidateName}
            - Job Title: ${jobTitle || 'the position'}
            - Company: ${companyName || 'our company'}
            - Date: ${interviewDate}
            - Time: ${interviewTime}
            - Type: ${interviewType || 'interview'}
            
            Include:
            - Warm greeting and congratulations on moving forward
            - Clear interview details
            - What to expect/prepare
            - Contact information for questions
            - Professional closing
            
            Make it encouraging and professional.`
          }
        ],
        temperature: 0.5,
        max_tokens: 800,
      }),
    });

    if (!groqResponse.ok) {
      throw new Error(`Groq API error: ${groqResponse.statusText}`);
    }

    const groqData = await groqResponse.json();
    const emailContent = groqData.choices[0].message.content;

    // Here you would integrate with your email service (SendGrid, etc.)
    // For now, we'll return the generated email content
    const emailData = {
      to: candidateEmail,
      subject: `Interview Confirmation - ${jobTitle || 'Position'} at ${companyName || 'Our Company'}`,
      html: emailContent,
      text: emailContent.replace(/<[^>]*>/g, ''), // Strip HTML for text version
    };

    // In a real implementation, you would send the email here
    // await sendEmail(emailData);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Interview email generated successfully',
        emailData 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in send-interview-email:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to generate interview email', details: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});