import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

interface EmergencyProtocolRequest {
  pet_id: string
  emergency_type: 'health_crisis' | 'injury' | 'poisoning' | 'seizure' | 'breathing_difficulty' | 'trauma' | 'other'
  severity: 'low' | 'medium' | 'high' | 'critical'
  symptoms?: string[]
  immediate_action_taken?: string
  location?: string
  notify_family?: boolean
  notify_veterinarian?: boolean
}

interface EmergencyResponse {
  protocol_id: string
  emergency_level: string
  immediate_actions: string[]
  warning_signs: string[]
  when_to_call_vet: string
  emergency_contacts: {
    primary_vet?: {
      name: string
      phone: string
      address?: string
    }
    emergency_vet?: {
      name: string
      phone: string
      address?: string
    }
    poison_control?: string
    family_contacts: Array<{
      name: string
      phone: string
      role: string
    }>
  }
  medical_history: {
    allergies: string[]
    medications: string[]
    conditions: string[]
    last_vet_visit?: string
  }
  transport_instructions: string[]
  estimated_response_time: string
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    )

    // Get user from JWT token
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser()
    if (userError || !user) {
      throw new Error('Unauthorized: Invalid or missing authentication token')
    }

    const requestData: EmergencyProtocolRequest = await req.json()
    const { pet_id, emergency_type, severity, symptoms, immediate_action_taken, location, notify_family = true, notify_veterinarian = false } = requestData

    // Validate request parameters
    if (!pet_id || !emergency_type || !severity) {
      throw new Error('pet_id, emergency_type, and severity are required')
    }

    // Verify user has access to the pet
    const { data: petData, error: petError } = await supabaseClient
      .from('pets')
      .select(`
        *,
        families!inner(
          *,
          family_members!inner(
            user_id,
            role,
            users(full_name, phone, email)
          )
        )
      `)
      .eq('id', pet_id)
      .single()

    if (petError || !petData) {
      throw new Error('Pet not found or access denied')
    }

    // Get emergency protocols for this pet
    const { data: protocols, error: protocolError } = await supabaseClient
      .from('emergency_protocols')
      .select('*')
      .eq('pet_id', pet_id)
      .eq('is_active', true)
      .order('emergency_level', { ascending: false })

    if (protocolError) throw protocolError

    // Get pet's medical history for emergency context
    const medicalHistory = await getEmergencyMedicalContext(supabaseClient, pet_id)

    // Generate emergency response protocol
    const emergencyResponse = await generateEmergencyResponse(
      supabaseClient,
      petData,
      protocols || [],
      emergency_type,
      severity,
      symptoms || [],
      medicalHistory
    )

    // Log the emergency incident
    const incidentId = await logEmergencyIncident(
      supabaseClient,
      user.id,
      pet_id,
      emergency_type,
      severity,
      symptoms,
      immediate_action_taken,
      location
    )

    // Send notifications if requested
    if (notify_family) {
      await notifyFamilyMembers(supabaseClient, petData, emergencyResponse, incidentId)
    }

    if (notify_veterinarian) {
      await notifyVeterinarian(supabaseClient, petData, emergencyResponse, incidentId)
    }

    return new Response(
      JSON.stringify({
        success: true,
        incident_id: incidentId,
        emergency_response: emergencyResponse,
        timestamp: new Date().toISOString()
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )

  } catch (error) {
    console.error('Emergency Protocol Error:', error)
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      },
    )
  }
})

async function getEmergencyMedicalContext(supabaseClient: any, pet_id: string) {
  // Get allergies and medical conditions
  const { data: pet, error: petError } = await supabaseClient
    .from('pets')
    .select('allergies, special_needs, emergency_medical_notes')
    .eq('id', pet_id)
    .single()

  if (petError) throw petError

  // Get current medications
  const { data: medications, error: medError } = await supabaseClient
    .from('medications')
    .select('medication_name, dosage_amount, dosage_unit, administration_instructions')
    .eq('pet_id', pet_id)
    .eq('active', true)

  if (medError) throw medError

  // Get recent medical records
  const { data: recentRecords, error: recordError } = await supabaseClient
    .from('medical_records')
    .select('diagnosis, treatment_plan, date_of_record')
    .eq('pet_id', pet_id)
    .order('date_of_record', { ascending: false })
    .limit(3)

  if (recordError) throw recordError

  return {
    allergies: pet.allergies ? pet.allergies.split(',').map((s: string) => s.trim()) : [],
    special_needs: pet.special_needs || '',
    emergency_notes: pet.emergency_medical_notes || '',
    current_medications: medications || [],
    recent_conditions: recentRecords?.map((r: any) => r.diagnosis).filter(Boolean) || [],
    last_vet_visit: recentRecords?.[0]?.date_of_record || null
  }
}

async function generateEmergencyResponse(
  supabaseClient: any,
  petData: any,
  protocols: any[],
  emergency_type: string,
  severity: string,
  symptoms: string[],
  medicalHistory: any
): Promise<EmergencyResponse> {
  
  // Find specific protocol for this emergency type or use general protocol
  const specificProtocol = protocols.find(p => 
    p.condition_name.toLowerCase().includes(emergency_type.toLowerCase())
  ) || protocols.find(p => p.condition_name.toLowerCase() === 'general_emergency')

  // Generate immediate actions based on emergency type and severity
  const immediateActions = generateImmediateActions(emergency_type, severity, symptoms, medicalHistory)
  
  // Get warning signs to watch for
  const warningSignsToWatch = getWarningSignsForEmergency(emergency_type, severity)
  
  // Determine when to call vet
  const vetCallCriteria = getVeterinarianCallCriteria(emergency_type, severity)
  
  // Get emergency contacts
  const emergencyContacts = await getEmergencyContacts(supabaseClient, petData)
  
  // Generate transport instructions
  const transportInstructions = getTransportInstructions(emergency_type, severity, petData.species)
  
  // Estimate response time based on severity
  const estimatedResponseTime = getEstimatedResponseTime(severity)

  return {
    protocol_id: specificProtocol?.id || 'general',
    emergency_level: mapSeverityToLevel(severity),
    immediate_actions: immediateActions,
    warning_signs: warningSignsToWatch,
    when_to_call_vet: vetCallCriteria,
    emergency_contacts: emergencyContacts,
    medical_history: {
      allergies: medicalHistory.allergies,
      medications: medicalHistory.current_medications.map((m: any) => 
        `${m.medication_name} - ${m.dosage_amount}${m.dosage_unit}`
      ),
      conditions: medicalHistory.recent_conditions,
      last_vet_visit: medicalHistory.last_vet_visit
    },
    transport_instructions: transportInstructions,
    estimated_response_time: estimatedResponseTime
  }
}

function generateImmediateActions(
  emergency_type: string,
  severity: string,
  symptoms: string[],
  medicalHistory: any
): string[] {
  const actions: string[] = []
  
  // Universal first actions
  actions.push("Stay calm and assess the situation")
  actions.push("Ensure your own safety before approaching the pet")
  
  switch (emergency_type) {
    case 'poisoning':
      actions.push("Remove pet from source of poison immediately")
      actions.push("Do NOT induce vomiting unless specifically instructed by poison control")
      actions.push("Call pet poison control hotline immediately")
      actions.push("Collect sample of suspected poison for veterinarian")
      break
      
    case 'seizure':
      actions.push("Do not try to hold or restrain the pet during seizure")
      actions.push("Clear area of furniture and objects that could cause injury")
      actions.push("Time the seizure duration")
      actions.push("Keep pet cool and speak in calm, soothing voice")
      actions.push("Do not put anything in pet's mouth")
      break
      
    case 'breathing_difficulty':
      actions.push("Check airway for obstructions")
      actions.push("Loosen collar or harness")
      actions.push("Keep pet in upright position if possible")
      actions.push("Monitor breathing rate and pattern")
      actions.push("Prepare for immediate transport to emergency vet")
      break
      
    case 'trauma':
      actions.push("Control bleeding with clean cloth or bandage")
      actions.push("Do not move pet unless necessary for safety")
      actions.push("Keep pet warm with blankets")
      actions.push("Monitor for signs of shock")
      actions.push("Immobilize injured limbs if possible")
      break
      
    case 'injury':
      actions.push("Assess extent of injury without causing further harm")
      actions.push("Apply direct pressure to bleeding wounds")
      actions.push("Keep injured area elevated if possible")
      actions.push("Document injury with photos if safe to do so")
      break
      
    default:
      actions.push("Monitor vital signs if possible")
      actions.push("Document symptoms and timeline")
      actions.push("Prepare pet's medical information for veterinarian")
  }
  
  // Severity-specific actions
  if (severity === 'critical') {
    actions.push("Call emergency veterinarian immediately")
    actions.push("Prepare for immediate transport")
    actions.push("Have someone drive while you monitor the pet")
  }
  
  // Medical history considerations
  if (medicalHistory.allergies.length > 0) {
    actions.push(`Alert veterinarian of known allergies: ${medicalHistory.allergies.join(', ')}`)
  }
  
  return actions
}

function getWarningSignsForEmergency(emergency_type: string, severity: string): string[] {
  const warningSigns: string[] = []
  
  // Common warning signs that indicate worsening condition
  warningSigns.push("Loss of consciousness")
  warningSigns.push("Difficulty breathing or rapid breathing")
  warningSigns.push("Pale or blue gums")
  warningSigns.push("Rapid or weak pulse")
  warningSigns.push("Severe lethargy or unresponsiveness")
  
  switch (emergency_type) {
    case 'poisoning':
      warningSigns.push("Vomiting or diarrhea")
      warningSigns.push("Drooling excessively")
      warningSigns.push("Loss of coordination")
      warningSigns.push("Tremors or seizures")
      break
      
    case 'seizure':
      warningSigns.push("Seizure lasting more than 5 minutes")
      warningSigns.push("Multiple seizures in short period")
      warningSigns.push("Post-seizure disorientation lasting more than 30 minutes")
      break
      
    case 'breathing_difficulty':
      warningSigns.push("Open mouth breathing in cats")
      warningSigns.push("Extended neck and head position")
      warningSigns.push("Anxious or panicked behavior")
      break
  }
  
  return warningSigns
}

function getVeterinarianCallCriteria(emergency_type: string, severity: string): string {
  const baseCriteria = "Contact veterinarian immediately if:"
  
  const specificCriteria: string[] = []
  
  if (severity === 'critical') {
    return "Call emergency veterinarian immediately - do not wait"
  }
  
  switch (emergency_type) {
    case 'poisoning':
      specificCriteria.push("Any known ingestion of toxic substance")
      specificCriteria.push("Symptoms worsen or new symptoms appear")
      break
      
    case 'seizure':
      specificCriteria.push("First-time seizure")
      specificCriteria.push("Seizure lasts more than 2 minutes")
      specificCriteria.push("Multiple seizures occur")
      break
      
    case 'breathing_difficulty':
      specificCriteria.push("Any difficulty breathing")
      specificCriteria.push("Blue or pale gums")
      specificCriteria.push("Collapse or loss of consciousness")
      break
      
    default:
      specificCriteria.push("Symptoms persist or worsen")
      specificCriteria.push("Pet shows signs of pain or distress")
      specificCriteria.push("Any concerning changes in behavior")
  }
  
  return `${baseCriteria}\n• ${specificCriteria.join('\n• ')}`
}

async function getEmergencyContacts(supabaseClient: any, petData: any) {
  // Get primary veterinarian
  const { data: primaryVet } = await supabaseClient
    .from('pet_veterinarians')
    .select(`
      veterinarians (
        name,
        phone,
        clinic_name,
        address_line1,
        city,
        state,
        emergency_services,
        after_hours_contact
      )
    `)
    .eq('pet_id', petData.id)
    .eq('relationship_type', 'primary')
    .eq('is_active', true)
    .single()

  // Get emergency veterinarian (24-hour clinic)
  const { data: emergencyVets } = await supabaseClient
    .from('veterinarians')
    .select('name, phone, clinic_name, address_line1, city, state')
    .eq('emergency_services', true)
    .limit(1)

  // Extract family member contacts
  const familyContacts = petData.families.family_members.map((member: any) => ({
    name: member.users.full_name,
    phone: member.users.phone,
    role: member.role,
    email: member.users.email
  })).filter((contact: any) => contact.phone)

  return {
    primary_vet: primaryVet?.veterinarians ? {
      name: primaryVet.veterinarians.name,
      phone: primaryVet.veterinarians.phone,
      address: `${primaryVet.veterinarians.clinic_name}, ${primaryVet.veterinarians.city}, ${primaryVet.veterinarians.state}`
    } : undefined,
    emergency_vet: emergencyVets?.[0] ? {
      name: emergencyVets[0].name,
      phone: emergencyVets[0].phone,
      address: `${emergencyVets[0].clinic_name}, ${emergencyVets[0].city}, ${emergencyVets[0].state}`
    } : undefined,
    poison_control: "1-888-426-4435", // ASPCA Animal Poison Control Center
    family_contacts: familyContacts
  }
}

function getTransportInstructions(emergency_type: string, severity: string, species: string): string[] {
  const instructions: string[] = []
  
  // Universal transport safety
  instructions.push("Use a carrier or secure restraint system")
  instructions.push("Have someone else drive while you monitor the pet")
  instructions.push("Call ahead to notify veterinary clinic of arrival")
  instructions.push("Bring pet's medical records and medication list")
  
  // Species-specific instructions
  if (species.toLowerCase() === 'cat') {
    instructions.push("Use a secure cat carrier - avoid using arms alone")
    instructions.push("Cover carrier with blanket to reduce stress")
  } else if (species.toLowerCase() === 'dog') {
    instructions.push("Use a leash and/or carrier appropriate for dog size")
    instructions.push("Consider muzzle if pet is in pain (unless breathing difficulty)")
  }
  
  // Emergency-specific instructions
  switch (emergency_type) {
    case 'trauma':
      instructions.push("Move pet as little as possible")
      instructions.push("Use a rigid surface (board/blanket) for spinal injuries")
      instructions.push("Keep injured areas immobilized")
      break
      
    case 'breathing_difficulty':
      instructions.push("Keep pet upright during transport")
      instructions.push("Ensure adequate ventilation in carrier")
      instructions.push("Avoid covering carrier completely")
      break
      
    case 'seizure':
      instructions.push("Wait until seizure stops before moving pet")
      instructions.push("Pad carrier to prevent injury during transport")
      break
  }
  
  return instructions
}

function getEstimatedResponseTime(severity: string): string {
  switch (severity) {
    case 'critical':
      return "Immediate - transport to emergency clinic now"
    case 'high':
      return "Within 1 hour - urgent veterinary care needed"
    case 'medium':
      return "Within 2-4 hours - schedule urgent appointment"
    case 'low':
      return "Within 24 hours - monitor and contact veterinarian"
    default:
      return "Contact veterinarian for guidance on timing"
  }
}

function mapSeverityToLevel(severity: string): string {
  const mapping: { [key: string]: string } = {
    'low': 'low',
    'medium': 'medium',
    'high': 'high',
    'critical': 'critical'
  }
  return mapping[severity] || 'medium'
}

async function logEmergencyIncident(
  supabaseClient: any,
  user_id: string,
  pet_id: string,
  emergency_type: string,
  severity: string,
  symptoms?: string[],
  action_taken?: string,
  location?: string
): Promise<string> {
  
  const { data, error } = await supabaseClient
    .from('emergency_incidents')
    .insert({
      pet_id,
      reported_by: user_id,
      incident_type: emergency_type,
      severity_level: severity,
      symptoms: symptoms || [],
      immediate_action_taken: action_taken,
      incident_location: location,
      reported_at: new Date().toISOString()
    })
    .select('id')
    .single()

  if (error) {
    console.error('Error logging emergency incident:', error)
    return 'temp-' + Date.now() // Return temporary ID if logging fails
  }
  
  return data.id
}

async function notifyFamilyMembers(
  supabaseClient: any,
  petData: any,
  emergencyResponse: EmergencyResponse,
  incidentId: string
) {
  const familyMembers = petData.families.family_members
  
  for (const member of familyMembers) {
    // Create urgent notification for each family member
    await supabaseClient
      .from('notifications')
      .insert({
        user_id: member.user_id,
        family_id: petData.family_id,
        pet_id: petData.id,
        type: 'health_alert',
        title: `EMERGENCY: ${petData.name} needs immediate attention`,
        message: `Emergency protocol activated for ${petData.name}. Severity: ${emergencyResponse.emergency_level}. Please check emergency response details.`,
        priority: 10,
        is_urgent: true,
        related_id: incidentId,
        related_table: 'emergency_incidents',
        requires_acknowledgment: true
      })
  }
}

async function notifyVeterinarian(
  supabaseClient: any,
  petData: any,
  emergencyResponse: EmergencyResponse,
  incidentId: string
) {
  // This would integrate with veterinarian notification systems
  // For now, we'll log the veterinarian notification request
  console.log('Veterinarian notification requested for pet:', petData.id, 'incident:', incidentId)
  
  // In a real implementation, this would:
  // 1. Send SMS/email to primary veterinarian
  // 2. Update veterinary practice management systems
  // 3. Log the notification in the system
}