import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
)

const PRODUCT_PLAN_MAP: Record<string, string> = {
  'metaflux-starter': 'starter',
  'metaflux-pro': 'pro',
  'metaflux-agency': 'agency',
  'metaflux-addon': 'addon',
}

serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 })
  }

  try {
    const payload = await req.json()

    // Save raw event
    await supabase.from('cakto_events').insert({
      event_type: payload.event,
      payload,
      processed: false,
    })

    const { event, data } = payload
    const email = data?.customer?.email || data?.email
    if (!email) {
      return new Response(JSON.stringify({ ok: false, error: 'no email' }), { status: 400 })
    }

    // Find profile by email, fallback to client_reference_id
    let profile: any = null
    const { data: byEmail } = await supabase
      .from('profiles')
      .select('id, plan, ai_credits_remaining')
      .eq('email', email)
      .single()
    
    if (byEmail) {
      profile = byEmail
    } else {
      const refId = data?.client_reference_id
      if (refId) {
        const { data: byRef } = await supabase
          .from('profiles')
          .select('id, plan, ai_credits_remaining')
          .eq('id', refId)
          .single()
        profile = byRef
      }
    }

    if (!profile) {
      return new Response(JSON.stringify({ ok: false, error: 'profile not found' }), { status: 404 })
    }

    const productId = data?.product?.id || data?.product_id || ''
    const plan = PRODUCT_PLAN_MAP[productId]

    const creditsMap: Record<string, number> = {
      starter: 50,
      pro: 150,
      agency: 9999,
    }

    switch (event) {
      case 'purchase.approved':
      case 'subscription.active': {
        if (plan === 'addon') {
          await supabase
            .from('profiles')
            .update({
              ai_credits_remaining: (profile.ai_credits_remaining || 0) + 50,
              updated_at: new Date().toISOString(),
            })
            .eq('id', profile.id)
        } else if (plan) {
          const expiresAt = new Date()
          expiresAt.setMonth(expiresAt.getMonth() + 1)

          await supabase
            .from('profiles')
            .update({
              plan,
              plan_status: 'active',
              plan_expires_at: expiresAt.toISOString(),
              cakto_subscription_id: data?.subscription_id || data?.id || null,
              ai_credits_remaining: creditsMap[plan] || 50,
              updated_at: new Date().toISOString(),
            })
            .eq('id', profile.id)
        }
        break
      }

      case 'subscription.cancelled':
      case 'subscription.canceled': {
        await supabase
          .from('profiles')
          .update({
            plan_status: 'cancelled',
            updated_at: new Date().toISOString(),
          })
          .eq('id', profile.id)
        break
      }

      case 'subscription.past_due':
      case 'charge.failed': {
        await supabase
          .from('profiles')
          .update({
            plan_status: 'inactive',
            updated_at: new Date().toISOString(),
          })
          .eq('id', profile.id)
        break
      }

      case 'subscription.renewed': {
        const newExpires = new Date()
        newExpires.setMonth(newExpires.getMonth() + 1)

        await supabase
          .from('profiles')
          .update({
            plan_status: 'active',
            plan_expires_at: newExpires.toISOString(),
            ai_credits_remaining: creditsMap[profile.plan || 'starter'] || 50,
            updated_at: new Date().toISOString(),
          })
          .eq('id', profile.id)
        break
      }
    }

    // Mark event processed
    await supabase
      .from('cakto_events')
      .update({ processed: true })
      .eq('payload->>event', event)
      .eq('processed', false)

    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (err: any) {
    console.error('Cakto webhook error:', err)
    return new Response(JSON.stringify({ ok: false, error: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
})
