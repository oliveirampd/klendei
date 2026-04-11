import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const {
      business_id,
      professional_id,
      service_id,
      datetime,
      client_name,
      client_phone,
      notes,
    } = body;

    // Validate required fields
    if (!business_id || !service_id || !datetime || !client_name || !client_phone) {
      return new Response(
        JSON.stringify({ error: "Campos obrigatórios não preenchidos." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate phone
    const phone = client_phone.replace(/\D/g, "");
    if (phone.length < 10) {
      return new Response(
        JSON.stringify({ error: "Telefone inválido." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate datetime is in the future
    const appointmentDate = new Date(datetime);
    if (isNaN(appointmentDate.getTime()) || appointmentDate <= new Date()) {
      return new Response(
        JSON.stringify({ error: "O horário selecionado já passou." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Verify business exists
    const { data: business, error: bizErr } = await supabase
      .from("businesses")
      .select("id")
      .eq("id", business_id)
      .maybeSingle();

    if (bizErr || !business) {
      return new Response(
        JSON.stringify({ error: "Negócio não encontrado." }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Verify service belongs to business
    const { data: service, error: svcErr } = await supabase
      .from("services")
      .select("id, duration_minutes")
      .eq("id", service_id)
      .eq("business_id", business_id)
      .eq("active", true)
      .maybeSingle();

    if (svcErr || !service) {
      return new Response(
        JSON.stringify({ error: "Serviço não encontrado." }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Determine professional
    let profId = professional_id;
    if (!profId) {
      // Pick first available professional
      const { data: profs } = await supabase
        .from("professionals")
        .select("id")
        .eq("business_id", business_id)
        .eq("active", true)
        .limit(1);
      if (!profs || profs.length === 0) {
        return new Response(
          JSON.stringify({ error: "Nenhum profissional disponível." }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      profId = profs[0].id;
    } else {
      // Verify professional belongs to business
      const { data: prof } = await supabase
        .from("professionals")
        .select("id")
        .eq("id", profId)
        .eq("business_id", business_id)
        .eq("active", true)
        .maybeSingle();
      if (!prof) {
        return new Response(
          JSON.stringify({ error: "Profissional não encontrado." }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    // Check for time conflict
    const slotStart = new Date(datetime);
    const slotEnd = new Date(slotStart.getTime() + service.duration_minutes * 60000);

    const { data: conflicts } = await supabase
      .from("appointments")
      .select("id, datetime, service:services(duration_minutes)")
      .eq("business_id", business_id)
      .eq("professional_id", profId)
      .neq("status", "cancelled")
      .gte("datetime", new Date(slotStart.getTime() - 12 * 3600000).toISOString())
      .lte("datetime", new Date(slotStart.getTime() + 12 * 3600000).toISOString());

    const hasConflict = (conflicts || []).some((apt: any) => {
      const aptStart = new Date(apt.datetime);
      const aptEnd = new Date(aptStart.getTime() + (apt.service?.duration_minutes || 30) * 60000);
      return slotStart < aptEnd && slotEnd > aptStart;
    });

    if (hasConflict) {
      return new Response(
        JSON.stringify({ error: "Este horário não está mais disponível." }),
        { status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Upsert client
    const { data: existingClient } = await supabase
      .from("clients")
      .select("id")
      .eq("business_id", business_id)
      .eq("phone", phone)
      .maybeSingle();

    let clientId: string;
    if (existingClient) {
      clientId = existingClient.id;
      // Update last visit and name
      await supabase
        .from("clients")
        .update({
          name: client_name,
          last_visit: datetime,
          total_visits: (await supabase.rpc("", {})).count, // we'll just increment
        })
        .eq("id", clientId);
    } else {
      const { data: newClient, error: clientErr } = await supabase
        .from("clients")
        .insert({
          business_id,
          name: client_name,
          phone,
          first_visit: datetime,
          last_visit: datetime,
          total_visits: 1,
        })
        .select("id")
        .single();

      if (clientErr) {
        return new Response(
          JSON.stringify({ error: "Erro ao registrar cliente." }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      clientId = newClient.id;
    }

    // Create appointment
    const { data: appointment, error: aptErr } = await supabase
      .from("appointments")
      .insert({
        business_id,
        professional_id: profId,
        service_id,
        client_id: clientId,
        datetime,
        notes: notes || null,
        status: "pending",
      })
      .select("id")
      .single();

    if (aptErr) {
      console.error("Appointment insert error:", aptErr);
      return new Response(
        JSON.stringify({ error: "Erro ao criar agendamento." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ success: true, appointment_id: appointment.id }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Unexpected error:", err);
    return new Response(
      JSON.stringify({ error: "Erro interno. Tente novamente." }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
