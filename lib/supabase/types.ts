// Hand-written types matching /supabase/migrations/0001_initial_schema.sql.
// After the migration is applied to the live project, these can be regenerated
// via: npx supabase gen types typescript --project-id <id> > lib/supabase/types.ts

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      leads: {
        Row: {
          id: string;
          email: string;
          first_name: string | null;
          last_name: string | null;
          practice_name: string | null;
          role: string | null;
          source: string | null;
          utm_source: string | null;
          utm_medium: string | null;
          utm_campaign: string | null;
          interest: string[];
          created_at: string;
        };
        Insert: {
          id?: string;
          email: string;
          first_name?: string | null;
          last_name?: string | null;
          practice_name?: string | null;
          role?: string | null;
          source?: string | null;
          utm_source?: string | null;
          utm_medium?: string | null;
          utm_campaign?: string | null;
          interest?: string[];
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["leads"]["Insert"]>;
        Relationships: [];
      };
      demo_requests: {
        Row: {
          id: string;
          first_name: string;
          last_name: string;
          email: string;
          phone: string | null;
          practice_name: string;
          role: string;
          practice_type: string | null;
          state: string | null;
          current_devices: string[] | null;
          monthly_treatment_volume: string | null;
          primary_interest: string[] | null;
          timeline: string | null;
          cal_booking_id: string | null;
          status: string;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          first_name: string;
          last_name: string;
          email: string;
          phone?: string | null;
          practice_name: string;
          role: string;
          practice_type?: string | null;
          state?: string | null;
          current_devices?: string[] | null;
          monthly_treatment_volume?: string | null;
          primary_interest?: string[] | null;
          timeline?: string | null;
          cal_booking_id?: string | null;
          status?: string;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["demo_requests"]["Insert"]>;
        Relationships: [];
      };
      event_rsvps: {
        Row: {
          id: string;
          event_slug: string;
          first_name: string;
          last_name: string;
          email: string;
          practice_name: string | null;
          role: string | null;
          attending_in_person: boolean;
          attending_virtual: boolean;
          dietary_restrictions: string | null;
          guest_count: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          event_slug: string;
          first_name: string;
          last_name: string;
          email: string;
          practice_name?: string | null;
          role?: string | null;
          attending_in_person?: boolean;
          attending_virtual?: boolean;
          dietary_restrictions?: string | null;
          guest_count?: number;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["event_rsvps"]["Insert"]>;
        Relationships: [];
      };
      practitioners: {
        Row: {
          id: string;
          first_name: string | null;
          last_name: string | null;
          practice_name: string | null;
          role: string | null;
          device_serial: string | null;
          device_purchased_at: string | null;
          onboarded_at: string | null;
          is_admin: boolean;
          created_at: string;
        };
        Insert: {
          id: string;
          first_name?: string | null;
          last_name?: string | null;
          practice_name?: string | null;
          role?: string | null;
          device_serial?: string | null;
          device_purchased_at?: string | null;
          onboarded_at?: string | null;
          is_admin?: boolean;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["practitioners"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "practitioners_id_fkey";
            columns: ["id"];
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      treatment_logs: {
        Row: {
          id: string;
          practitioner_id: string | null;
          patient_local_ref: string | null;
          patient_age_range: string | null;
          patient_fitzpatrick: number | null;
          patient_sex: string | null;
          indication_slug: string;
          protocol_slug: string | null;
          session_number: number | null;
          total_sessions_planned: number | null;
          wavelength_nm: number | null;
          fluence_j_cm2: number | null;
          spot_size_mm: number | null;
          pulse_count: number | null;
          endpoint_observed: string | null;
          immediate_response: string | null;
          complications: string[] | null;
          practitioner_satisfaction: number | null;
          notes: string | null;
          patient_consent_marketing: boolean;
          treatment_date: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          practitioner_id?: string | null;
          patient_local_ref?: string | null;
          patient_age_range?: string | null;
          patient_fitzpatrick?: number | null;
          patient_sex?: string | null;
          indication_slug: string;
          protocol_slug?: string | null;
          session_number?: number | null;
          total_sessions_planned?: number | null;
          wavelength_nm?: number | null;
          fluence_j_cm2?: number | null;
          spot_size_mm?: number | null;
          pulse_count?: number | null;
          endpoint_observed?: string | null;
          immediate_response?: string | null;
          complications?: string[] | null;
          practitioner_satisfaction?: number | null;
          notes?: string | null;
          patient_consent_marketing?: boolean;
          treatment_date: string;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["treatment_logs"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "treatment_logs_practitioner_id_fkey";
            columns: ["practitioner_id"];
            referencedRelation: "practitioners";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
