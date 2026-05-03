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
      audit_log: {
        Row: {
          id: string;
          created_at: string;
          actor_id: string | null;
          actor_role: string | null;
          action: string;
          target_type: string | null;
          target_id: string | null;
          metadata: Json;
          ip_address: string | null;
        };
        Insert: {
          id?: string;
          created_at?: string;
          actor_id?: string | null;
          actor_role?: string | null;
          action: string;
          target_type?: string | null;
          target_id?: string | null;
          metadata?: Json;
          ip_address?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["audit_log"]["Insert"]>;
        Relationships: [];
      };
      practices: {
        Row: {
          id: string;
          created_at: string;
          updated_at: string;
          name: string;
          primary_email: string;
          phone: string | null;
          address_line1: string | null;
          address_line2: string | null;
          city: string | null;
          state: string | null;
          postal_code: string | null;
          country: string | null;
          status: "pending" | "active" | "suspended" | "archived";
          status_changed_at: string | null;
          status_changed_by: string | null;
          auth_user_id: string | null;
          provisioned_by: string | null;
          provisioned_at: string | null;
          internal_notes: string | null;
        };
        Insert: {
          id?: string;
          created_at?: string;
          updated_at?: string;
          name: string;
          primary_email: string;
          phone?: string | null;
          address_line1?: string | null;
          address_line2?: string | null;
          city?: string | null;
          state?: string | null;
          postal_code?: string | null;
          country?: string | null;
          status?: "pending" | "active" | "suspended" | "archived";
          status_changed_at?: string | null;
          status_changed_by?: string | null;
          auth_user_id?: string | null;
          provisioned_by?: string | null;
          provisioned_at?: string | null;
          internal_notes?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["practices"]["Insert"]>;
        Relationships: [];
      };
      practice_users: {
        Row: {
          id: string;
          created_at: string;
          practice_id: string;
          full_name: string;
          role_at_practice: string | null;
          is_active: boolean;
          notes: string | null;
        };
        Insert: {
          id?: string;
          created_at?: string;
          practice_id: string;
          full_name: string;
          role_at_practice?: string | null;
          is_active?: boolean;
          notes?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["practice_users"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "practice_users_practice_id_fkey";
            columns: ["practice_id"];
            referencedRelation: "practices";
            referencedColumns: ["id"];
          },
        ];
      };
      devices: {
        Row: {
          id: string;
          created_at: string;
          slug: string;
          display_name: string;
          short_description: string | null;
          is_active: boolean;
          sort_order: number;
        };
        Insert: {
          id?: string;
          created_at?: string;
          slug: string;
          display_name: string;
          short_description?: string | null;
          is_active?: boolean;
          sort_order?: number;
        };
        Update: Partial<Database["public"]["Tables"]["devices"]["Insert"]>;
        Relationships: [];
      };
      practice_devices: {
        Row: {
          id: string;
          created_at: string;
          practice_id: string;
          device_id: string;
          serial_number: string | null;
          acquired_at: string | null;
          notes: string | null;
        };
        Insert: {
          id?: string;
          created_at?: string;
          practice_id: string;
          device_id: string;
          serial_number?: string | null;
          acquired_at?: string | null;
          notes?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["practice_devices"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "practice_devices_practice_id_fkey";
            columns: ["practice_id"];
            referencedRelation: "practices";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "practice_devices_device_id_fkey";
            columns: ["device_id"];
            referencedRelation: "devices";
            referencedColumns: ["id"];
          },
        ];
      };
      contact_messages: {
        Row: {
          id: string;
          created_at: string;
          full_name: string;
          email: string;
          organization: string | null;
          subject: string;
          message: string;
          utm_source: string | null;
          utm_medium: string | null;
          utm_campaign: string | null;
        };
        Insert: {
          id?: string;
          created_at?: string;
          full_name: string;
          email: string;
          organization?: string | null;
          subject: string;
          message: string;
          utm_source?: string | null;
          utm_medium?: string | null;
          utm_campaign?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["contact_messages"]["Insert"]>;
        Relationships: [];
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
    Functions: {
      log_audit: {
        Args: {
          p_actor_id?: string | null;
          p_actor_role?: string | null;
          p_action: string;
          p_target_type?: string | null;
          p_target_id?: string | null;
          p_metadata?: Json;
          p_ip_address?: string | null;
        };
        Returns: string;
      };
      auth_role: {
        Args: Record<string, never>;
        Returns: string | null;
      };
      is_admin: {
        Args: Record<string, never>;
        Returns: boolean;
      };
      is_practice: {
        Args: Record<string, never>;
        Returns: boolean;
      };
      current_practice_id: {
        Args: Record<string, never>;
        Returns: string | null;
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
