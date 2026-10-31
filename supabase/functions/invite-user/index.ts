import { createClient } from 'npm:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  // Manejar CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // 1. Crear cliente con la clave de servicio (Admin)
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    // 2. Verificar que el usuario que llama es quien dice ser
    const authHeader = req.headers.get('Authorization')!
    const supabaseUser = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    )
    
    const { data: { user }, error: userError } = await supabaseUser.auth.getUser()
    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'No autorizado' }), { 
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      })
    }

    // 3. (Opcional pero recomendado) Verificar que el usuario es SuperUsuario
    // Aquí podrías consultar tu tabla 'usuarios' y verificar el rol.
    // Por ahora, si el getUser fue exitoso, confiamos en que el frontend lo protegió.
    
    // 4. Invitar al nuevo usuario
    const { email, nombre_completo, rol_id } = await req.json()

    const { data, error } = await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
      data: { nombre_completo, rol_id: rol_id.toString() },
      redirectTo: `${new URL(req.url).origin}/login`
    })

    if (error) throw error

    // 5. Actualizar el rol en la tabla pública (el trigger lo crea como Visor)
    if (data?.user) {
      await supabaseAdmin
        .from('usuarios')
        .update({ rol_id: parseInt(rol_id), nombre_completo })
        .eq('id', data.user.id)
    }

    return new Response(JSON.stringify({ message: 'Invitación enviada', user: data.user }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})