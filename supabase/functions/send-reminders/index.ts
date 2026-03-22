// Edge Function: send-reminders
// Sends reminder emails to users who haven't completed both meditation and questionnaire for today
// Called by pg_cron scheduled job daily

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Get today's date in the app timezone
function getTodayDate(timezone: string = 'America/New_York'): string {
  const now = new Date()
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })
  
  const parts = formatter.formatToParts(now)
  const year = parts.find(p => p.type === 'year')?.value
  const month = parts.find(p => p.type === 'month')?.value
  const day = parts.find(p => p.type === 'day')?.value
  
  return `${year}-${month}-${day}`
}

// Send email via Resend API
async function sendReminderEmail(
  resendApiKey: string,
  to: string,
  dashboardUrl: string,
  fromEmail: string = 'Meditation Training <noreply@meditation-training.app>'
): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: fromEmail,
        to: [to],
        subject: 'Reminder: Complete Today\'s Meditation and Questionnaire',
        html: `
          <html>
            <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
              <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
                <h2 style="color: #4a5568;">Daily Reminder</h2>
                <p>Hello,</p>
                <p>You haven't completed today's meditation and questionnaire yet.</p>
                <p>Please visit your dashboard to:</p>
                <ul>
                  <li>Listen to today's meditation</li>
                  <li>Complete the daily questionnaire</li>
                </ul>
                <p style="margin-top: 30px;">
                  <a href="${dashboardUrl}" 
                     style="background-color: #4299e1; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">
                    Go to Dashboard
                  </a>
                </p>
                <p style="margin-top: 30px; font-size: 12px; color: #718096;">
                  This is an automated reminder. If you have already completed today's tasks, please ignore this email.
                </p>
              </div>
            </body>
          </html>
        `,
        text: `Daily Reminder\n\nYou haven't completed today's meditation and questionnaire yet.\n\nPlease visit your dashboard: ${dashboardUrl}\n\nThis is an automated reminder.`,
      }),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      console.error('Resend API error:', response.status, errorData)
      return {
        success: false,
        error: `Resend API error: ${response.status} - ${JSON.stringify(errorData)}`,
      }
    }

    const data = await response.json()
    console.log('Email sent successfully:', data.id)
    return { success: true }
  } catch (error) {
    console.error('Error sending email:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    }
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Verify this is called by pg_cron (service role key in Authorization header)
    const authHeader = req.headers.get('Authorization')
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ error: 'Missing or invalid Authorization header' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
      )
    }

    const providedKey = authHeader.replace('Bearer ', '')
    if (providedKey !== serviceRoleKey) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized - invalid service role key' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
      )
    }

    // Get environment variables
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const resendApiKey = Deno.env.get('RESEND_API_KEY')
    const frontendUrl = Deno.env.get('FRONTEND_URL') || 'https://your-domain.com'
    const appTimezone = Deno.env.get('APP_TIMEZONE') || 'America/New_York'
    const fromEmail = Deno.env.get('RESEND_FROM_EMAIL') || 'Meditation Training <noreply@meditation-training.app>'

    if (!supabaseUrl || !supabaseServiceKey) {
      return new Response(
        JSON.stringify({ error: 'Server configuration error - Supabase credentials missing' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      )
    }

    if (!resendApiKey) {
      return new Response(
        JSON.stringify({ error: 'Server configuration error - RESEND_API_KEY not set' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      )
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Get today's date in app timezone
    const today = getTodayDate(appTimezone)

    // Find users who need reminders
    // Users need reminders if they haven't completed BOTH meditation AND questionnaire for today
    // AND haven't already received a reminder today
    
    // Get all users
    const { data: allUsers, error: allUsersError } = await supabase
      .from('users')
      .select('id, email, personal_code')

    if (allUsersError) {
      console.error('Error querying all users:', allUsersError)
      return new Response(
        JSON.stringify({ error: `Database query error: ${allUsersError.message}` }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      )
    }

    // Get logs for today
    const { data: todayLogs, error: logsError } = await supabase
      .from('daily_logs')
      .select('user_id, meditation_played, questionnaire_started_at, reminder_sent_at')
      .eq('date', today)

    if (logsError) {
      console.error('Error querying today logs:', logsError)
      return new Response(
        JSON.stringify({ error: `Database query error: ${logsError.message}` }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      )
    }

    // Build map of logs by user_id for efficient lookup
    const logsByUserId = new Map(
      (todayLogs || []).map(log => [log.user_id, log])
    )

    // Filter users who need reminders
    // User needs reminder if:
    // 1. No log entry for today, OR
    // 2. Has log but (meditation_played = false OR questionnaire_started_at IS NULL)
    // AND reminder_sent_at IS NULL (haven't sent reminder yet today)
    const usersNeedingReminders = (allUsers || [])
      .filter(user => {
        const log = logsByUserId.get(user.id)
        const needsReminder = 
          !log || 
          !log.meditation_played || 
          !log.questionnaire_started_at
        return needsReminder && (!log || !log.reminder_sent_at)
      })
      .map((user) => ({
        id: user.id,
        email: user.email,
        personal_code: user.personal_code as string,
      }))

    console.log(`Found ${usersNeedingReminders.length} users needing reminders for ${today}`)

    // Send emails and update logs
    const results = {
      total: usersNeedingReminders.length,
      sent: 0,
      failed: 0,
      errors: [] as string[],
    }

    for (const user of usersNeedingReminders) {
      const emailResult = await sendReminderEmail(resendApiKey, user.email, frontendUrl, fromEmail)

      if (emailResult.success) {
        results.sent++
        // Upsert daily_logs with reminder_sent_at
        const { error: updateError } = await supabase
          .from('daily_logs')
          .upsert({
            user_id: user.id,
            date: today,
            personal_code: user.personal_code,
            reminder_sent_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          }, {
            onConflict: 'user_id,date',
          })

        if (updateError) {
          console.error(`Failed to update reminder_sent_at for user ${user.id}:`, updateError)
          results.errors.push(`Failed to update log for ${user.email}: ${updateError.message}`)
        }
      } else {
        results.failed++
        results.errors.push(`Failed to send email to ${user.email}: ${emailResult.error}`)
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        date: today,
        results,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )
  } catch (error) {
    console.error('Send reminders error:', error)
    const errorMessage = error instanceof Error ? error.message : String(error)
    return new Response(
      JSON.stringify({ error: errorMessage || 'Failed to send reminders' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})
