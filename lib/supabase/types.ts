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
          // P8 — inbox status workflow
          status: "new" | "contacted" | "qualified" | "closed";
          status_changed_at: string | null;
          status_changed_by: string | null;
          admin_notes: string | null;
          enrichment_data: Json | null;
          enriched_at: string | null;
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
          status?: "new" | "contacted" | "qualified" | "closed";
          status_changed_at?: string | null;
          status_changed_by?: string | null;
          admin_notes?: string | null;
          enrichment_data?: Json | null;
          enriched_at?: string | null;
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
          // P8 narrows status to 4-value workflow (legacy 6-value mapped in 0010).
          status: "new" | "contacted" | "qualified" | "closed";
          notes: string | null;
          created_at: string;
          updated_at: string;
          // P8 — inbox status workflow
          status_changed_at: string | null;
          status_changed_by: string | null;
          admin_notes: string | null;
          enrichment_data: Json | null;
          enriched_at: string | null;
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
          status?: "new" | "contacted" | "qualified" | "closed";
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
          status_changed_at?: string | null;
          status_changed_by?: string | null;
          admin_notes?: string | null;
          enrichment_data?: Json | null;
          enriched_at?: string | null;
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
      practice_authorized_users: {
        Row: {
          id: string;
          created_at: string;
          updated_at: string;
          practice_id: string;
          full_name: string;
          role_label: string | null;
          is_active: boolean;
          sort_order: number;
        };
        Insert: {
          id?: string;
          created_at?: string;
          updated_at?: string;
          practice_id: string;
          full_name: string;
          role_label?: string | null;
          is_active?: boolean;
          sort_order?: number;
        };
        Update: Partial<Database["public"]["Tables"]["practice_authorized_users"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "practice_authorized_users_practice_id_fkey";
            columns: ["practice_id"];
            referencedRelation: "practices";
            referencedColumns: ["id"];
          },
        ];
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
      indication_categories: {
        Row: {
          id: string;
          sanity_id: string;
          sanity_rev: string | null;
          title: string;
          slug: string;
          short_description: string | null;
          sort_order: number | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          sanity_id: string;
          sanity_rev?: string | null;
          title: string;
          slug: string;
          short_description?: string | null;
          sort_order?: number | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["indication_categories"]["Insert"]>;
        Relationships: [];
      };
      protocols: {
        Row: {
          id: string;
          sanity_id: string;
          sanity_rev: string | null;
          title: string;
          slug: string;
          short_description: string | null;
          indication_category_id: string | null;
          indication_tags: string[];
          fitzpatrick_types: string[];
          status: "draft" | "published" | "archived";
          current_version: string | null;
          pending_major_bump: boolean;
          last_published_at: string | null;
          last_published_by: string | null;
          last_synced_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          sanity_id: string;
          sanity_rev?: string | null;
          title: string;
          slug: string;
          short_description?: string | null;
          indication_category_id?: string | null;
          indication_tags?: string[];
          fitzpatrick_types?: string[];
          status?: "draft" | "published" | "archived";
          current_version?: string | null;
          pending_major_bump?: boolean;
          last_published_at?: string | null;
          last_published_by?: string | null;
          last_synced_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["protocols"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "protocols_indication_category_id_fkey";
            columns: ["indication_category_id"];
            referencedRelation: "indication_categories";
            referencedColumns: ["id"];
          },
        ];
      };
      protocol_devices: {
        Row: {
          id: string;
          protocol_id: string;
          device_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          protocol_id: string;
          device_id: string;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["protocol_devices"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "protocol_devices_protocol_id_fkey";
            columns: ["protocol_id"];
            referencedRelation: "protocols";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "protocol_devices_device_id_fkey";
            columns: ["device_id"];
            referencedRelation: "devices";
            referencedColumns: ["id"];
          },
        ];
      };
      protocol_versions: {
        Row: {
          id: string;
          protocol_id: string;
          version: string;
          title: string;
          short_description: string | null;
          indication_category_sanity_id: string | null;
          indication_tags: string[];
          fitzpatrick_types: string[];
          sanity_snapshot: Json;
          published_at: string;
          published_by: string | null;
        };
        Insert: {
          id?: string;
          protocol_id: string;
          version: string;
          title: string;
          short_description?: string | null;
          indication_category_sanity_id?: string | null;
          indication_tags?: string[];
          fitzpatrick_types?: string[];
          sanity_snapshot: Json;
          published_at?: string;
          published_by?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["protocol_versions"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "protocol_versions_protocol_id_fkey";
            columns: ["protocol_id"];
            referencedRelation: "protocols";
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
          // P8 — inbox status workflow
          status: "new" | "contacted" | "qualified" | "closed";
          status_changed_at: string | null;
          status_changed_by: string | null;
          admin_notes: string | null;
          // P11 — Lead Enricher consistency (added in 0014)
          enrichment_data: Json | null;
          enriched_at: string | null;
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
          status?: "new" | "contacted" | "qualified" | "closed";
          status_changed_at?: string | null;
          status_changed_by?: string | null;
          admin_notes?: string | null;
          enrichment_data?: Json | null;
          enriched_at?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["contact_messages"]["Insert"]>;
        Relationships: [];
      };
      treatments: {
        Row: {
          id: string;
          created_at: string;
          updated_at: string;
          practice_id: string;
          entered_by_user_id: string | null;
          entered_by_name: string;
          treatment_date: string;
          protocol_id: string;
          protocol_version_id: string;
          protocol_version_label: string;
          protocol_deviation: boolean;
          protocol_deviation_reason: string | null;
          patient_anon_id: string | null;
          patient_age_range:
            | "under_18"
            | "18_25"
            | "26_35"
            | "36_45"
            | "46_55"
            | "56_65"
            | "over_65";
          patient_fitzpatrick: "I" | "II" | "III" | "IV" | "V" | "VI";
          patient_sex: "female" | "male" | "other" | "undisclosed" | null;
          indication: string;
          treatment_site: string | null;
          session_number: number;
          wavelength_nm: number | null;
          fluence_j_per_cm2: number | null;
          pulse_duration_ps: number | null;
          spot_size_mm: number | null;
          total_pulses: number | null;
          treatment_duration_minutes: number | null;
          prep_kit_used: boolean;
          recovery_kit_dispensed: boolean;
          maintenance_kit_recommended: boolean;
          notes: string | null;
          has_followup: boolean;
          followup_completed_at: string | null;
        };
        Insert: {
          id?: string;
          created_at?: string;
          updated_at?: string;
          practice_id: string;
          entered_by_user_id?: string | null;
          entered_by_name: string;
          treatment_date: string;
          protocol_id: string;
          protocol_version_id: string;
          protocol_version_label: string;
          protocol_deviation?: boolean;
          protocol_deviation_reason?: string | null;
          patient_anon_id?: string | null;
          patient_age_range:
            | "under_18"
            | "18_25"
            | "26_35"
            | "36_45"
            | "46_55"
            | "56_65"
            | "over_65";
          patient_fitzpatrick: "I" | "II" | "III" | "IV" | "V" | "VI";
          patient_sex?: "female" | "male" | "other" | "undisclosed" | null;
          indication: string;
          treatment_site?: string | null;
          session_number: number;
          wavelength_nm?: number | null;
          fluence_j_per_cm2?: number | null;
          pulse_duration_ps?: number | null;
          spot_size_mm?: number | null;
          total_pulses?: number | null;
          treatment_duration_minutes?: number | null;
          prep_kit_used?: boolean;
          recovery_kit_dispensed?: boolean;
          maintenance_kit_recommended?: boolean;
          notes?: string | null;
          has_followup?: boolean;
          followup_completed_at?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["treatments"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "treatments_practice_id_fkey";
            columns: ["practice_id"];
            referencedRelation: "practices";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "treatments_entered_by_user_id_fkey";
            columns: ["entered_by_user_id"];
            referencedRelation: "practice_authorized_users";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "treatments_protocol_id_fkey";
            columns: ["protocol_id"];
            referencedRelation: "protocols";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "treatments_protocol_version_id_fkey";
            columns: ["protocol_version_id"];
            referencedRelation: "protocol_versions";
            referencedColumns: ["id"];
          },
        ];
      };
      treatment_photos: {
        Row: {
          id: string;
          created_at: string;
          treatment_id: string;
          practice_id: string;
          storage_path: string;
          filename: string;
          mime_type: string;
          byte_size: number;
          capture_phase: "before" | "during" | "after" | "followup" | null;
          caption: string | null;
          consent_affirmed: boolean;
        };
        Insert: {
          id?: string;
          created_at?: string;
          treatment_id: string;
          practice_id: string;
          storage_path: string;
          filename: string;
          mime_type: string;
          byte_size: number;
          capture_phase?: "before" | "during" | "after" | "followup" | null;
          caption?: string | null;
          consent_affirmed?: boolean;
        };
        Update: Partial<Database["public"]["Tables"]["treatment_photos"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "treatment_photos_treatment_id_fkey";
            columns: ["treatment_id"];
            referencedRelation: "treatments";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "treatment_photos_practice_id_fkey";
            columns: ["practice_id"];
            referencedRelation: "practices";
            referencedColumns: ["id"];
          },
        ];
      };
      treatment_adverse_events: {
        Row: {
          id: string;
          created_at: string;
          updated_at: string;
          treatment_id: string;
          practice_id: string;
          description: string;
          status: "new" | "reviewing" | "addressed";
          status_changed_at: string | null;
          status_changed_by: string | null;
          admin_notes: string | null;
        };
        Insert: {
          id?: string;
          created_at?: string;
          updated_at?: string;
          treatment_id: string;
          practice_id: string;
          description: string;
          status?: "new" | "reviewing" | "addressed";
          status_changed_at?: string | null;
          status_changed_by?: string | null;
          admin_notes?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["treatment_adverse_events"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "treatment_adverse_events_treatment_id_fkey";
            columns: ["treatment_id"];
            referencedRelation: "treatments";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "treatment_adverse_events_practice_id_fkey";
            columns: ["practice_id"];
            referencedRelation: "practices";
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
      // P9 — training library + certification
      training_modules: {
        Row: {
          id: string;
          created_at: string;
          updated_at: string;
          title: string;
          slug: string;
          description: string | null;
          video_storage_path: string | null;
          video_duration_seconds: number | null;
          video_thumbnail_path: string | null;
          required_watch_percentage: number;
          status: "draft" | "published" | "archived";
          published_at: string | null;
          created_by: string | null;
          last_updated_by: string | null;
        };
        Insert: {
          id?: string;
          created_at?: string;
          updated_at?: string;
          title: string;
          slug: string;
          description?: string | null;
          video_storage_path?: string | null;
          video_duration_seconds?: number | null;
          video_thumbnail_path?: string | null;
          required_watch_percentage?: number;
          status?: "draft" | "published" | "archived";
          published_at?: string | null;
          created_by?: string | null;
          last_updated_by?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["training_modules"]["Insert"]>;
        Relationships: [];
      };
      training_curricula: {
        Row: {
          id: string;
          created_at: string;
          updated_at: string;
          device_id: string;
          title: string;
          description: string | null;
          status: "draft" | "published" | "archived";
          published_at: string | null;
          created_by: string | null;
          last_updated_by: string | null;
        };
        Insert: {
          id?: string;
          created_at?: string;
          updated_at?: string;
          device_id: string;
          title: string;
          description?: string | null;
          status?: "draft" | "published" | "archived";
          published_at?: string | null;
          created_by?: string | null;
          last_updated_by?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["training_curricula"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "training_curricula_device_id_fkey";
            columns: ["device_id"];
            referencedRelation: "devices";
            referencedColumns: ["id"];
          },
        ];
      };
      curriculum_modules: {
        Row: {
          id: string;
          created_at: string;
          curriculum_id: string;
          module_id: string;
          sort_order: number;
          is_required: boolean;
        };
        Insert: {
          id?: string;
          created_at?: string;
          curriculum_id: string;
          module_id: string;
          sort_order: number;
          is_required?: boolean;
        };
        Update: Partial<Database["public"]["Tables"]["curriculum_modules"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "curriculum_modules_curriculum_id_fkey";
            columns: ["curriculum_id"];
            referencedRelation: "training_curricula";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "curriculum_modules_module_id_fkey";
            columns: ["module_id"];
            referencedRelation: "training_modules";
            referencedColumns: ["id"];
          },
        ];
      };
      module_materials: {
        Row: {
          id: string;
          created_at: string;
          module_id: string;
          title: string;
          storage_path: string;
          filename: string;
          mime_type: string;
          byte_size: number;
          sort_order: number;
        };
        Insert: {
          id?: string;
          created_at?: string;
          module_id: string;
          title: string;
          storage_path: string;
          filename: string;
          mime_type: string;
          byte_size: number;
          sort_order?: number;
        };
        Update: Partial<Database["public"]["Tables"]["module_materials"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "module_materials_module_id_fkey";
            columns: ["module_id"];
            referencedRelation: "training_modules";
            referencedColumns: ["id"];
          },
        ];
      };
      module_progress: {
        Row: {
          id: string;
          created_at: string;
          updated_at: string;
          practice_id: string;
          practice_user_id: string | null;
          module_id: string;
          watch_percentage: number;
          last_position_seconds: number;
          watch_started_at: string | null;
          watch_completed_at: string | null;
          acknowledged: boolean;
          acknowledged_at: string | null;
          is_complete: boolean;
          completed_at: string | null;
        };
        Insert: {
          id?: string;
          created_at?: string;
          updated_at?: string;
          practice_id: string;
          practice_user_id?: string | null;
          module_id: string;
          watch_percentage?: number;
          last_position_seconds?: number;
          watch_started_at?: string | null;
          watch_completed_at?: string | null;
          acknowledged?: boolean;
          acknowledged_at?: string | null;
          is_complete?: boolean;
          completed_at?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["module_progress"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "module_progress_practice_id_fkey";
            columns: ["practice_id"];
            referencedRelation: "practices";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "module_progress_practice_user_id_fkey";
            columns: ["practice_user_id"];
            referencedRelation: "practice_authorized_users";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "module_progress_module_id_fkey";
            columns: ["module_id"];
            referencedRelation: "training_modules";
            referencedColumns: ["id"];
          },
        ];
      };
      practice_certifications: {
        Row: {
          id: string;
          created_at: string;
          updated_at: string;
          practice_id: string;
          // P9.1 — per-user cert (was practice-wide). Holder of
          // the certification.
          practice_user_id: string;
          device_id: string;
          curriculum_id: string;
          status: "in_progress" | "certified" | "expired" | "revoked";
          certified_at: string | null;
          // Whoever clicked the "complete certification" button.
          // Equal to practice_user_id for self-cert (current
          // pattern); reserved for future admin-granted certs.
          certified_by_user_id: string | null;
          expires_at: string | null;
          recert_required: boolean;
          recert_reason: string | null;
        };
        Insert: {
          id?: string;
          created_at?: string;
          updated_at?: string;
          practice_id: string;
          practice_user_id: string;
          device_id: string;
          curriculum_id: string;
          status?: "in_progress" | "certified" | "expired" | "revoked";
          certified_at?: string | null;
          certified_by_user_id?: string | null;
          expires_at?: string | null;
          recert_required?: boolean;
          recert_reason?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["practice_certifications"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "practice_certifications_practice_id_fkey";
            columns: ["practice_id"];
            referencedRelation: "practices";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "practice_certifications_practice_user_id_fkey";
            columns: ["practice_user_id"];
            referencedRelation: "practice_authorized_users";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "practice_certifications_device_id_fkey";
            columns: ["device_id"];
            referencedRelation: "devices";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "practice_certifications_curriculum_id_fkey";
            columns: ["curriculum_id"];
            referencedRelation: "training_curricula";
            referencedColumns: ["id"];
          },
        ];
      };
      // P10 — notifications
      notifications: {
        Row: {
          id: string;
          created_at: string;
          recipient_type: "practice" | "admin";
          practice_id: string | null;
          admin_user_id: string | null;
          practice_user_id: string | null;
          category: string;
          title: string;
          body: string | null;
          link_path: string | null;
          metadata: Json | null;
          read_at: string | null;
          event_id: string;
        };
        Insert: {
          id?: string;
          created_at?: string;
          recipient_type: "practice" | "admin";
          practice_id?: string | null;
          admin_user_id?: string | null;
          practice_user_id?: string | null;
          category: string;
          title: string;
          body?: string | null;
          link_path?: string | null;
          metadata?: Json | null;
          read_at?: string | null;
          event_id: string;
        };
        Update: Partial<Database["public"]["Tables"]["notifications"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "notifications_practice_id_fkey";
            columns: ["practice_id"];
            referencedRelation: "practices";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "notifications_admin_user_id_fkey";
            columns: ["admin_user_id"];
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "notifications_practice_user_id_fkey";
            columns: ["practice_user_id"];
            referencedRelation: "practice_authorized_users";
            referencedColumns: ["id"];
          },
        ];
      };
      notification_preferences: {
        Row: {
          id: string;
          created_at: string;
          updated_at: string;
          user_type: "practice" | "admin";
          practice_id: string | null;
          admin_user_id: string | null;
          preferences: Json;
          quiet_hours_start: string | null;
          quiet_hours_end: string | null;
          quiet_hours_timezone: string | null;
        };
        Insert: {
          id?: string;
          created_at?: string;
          updated_at?: string;
          user_type: "practice" | "admin";
          practice_id?: string | null;
          admin_user_id?: string | null;
          preferences?: Json;
          quiet_hours_start?: string | null;
          quiet_hours_end?: string | null;
          quiet_hours_timezone?: string | null;
        };
        Update: Partial<
          Database["public"]["Tables"]["notification_preferences"]["Insert"]
        >;
        Relationships: [
          {
            foreignKeyName: "notification_preferences_practice_id_fkey";
            columns: ["practice_id"];
            referencedRelation: "practices";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "notification_preferences_admin_user_id_fkey";
            columns: ["admin_user_id"];
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      notification_dispatch_log: {
        Row: {
          id: string;
          created_at: string;
          notification_id: string | null;
          channel: "in_app" | "email";
          status:
            | "sent"
            | "failed"
            | "skipped_preference"
            | "skipped_quiet_hours";
          resend_message_id: string | null;
          error_message: string | null;
        };
        Insert: {
          id?: string;
          created_at?: string;
          notification_id?: string | null;
          channel: "in_app" | "email";
          status:
            | "sent"
            | "failed"
            | "skipped_preference"
            | "skipped_quiet_hours";
          resend_message_id?: string | null;
          error_message?: string | null;
        };
        Update: Partial<
          Database["public"]["Tables"]["notification_dispatch_log"]["Insert"]
        >;
        Relationships: [
          {
            foreignKeyName: "notification_dispatch_log_notification_id_fkey";
            columns: ["notification_id"];
            referencedRelation: "notifications";
            referencedColumns: ["id"];
          },
        ];
      };
      // P11 — AI agent runs (admin-only)
      agent_runs: {
        Row: {
          id: string;
          created_at: string;
          agent_type:
            | "pattern_analyst"
            | "protocol_drafter"
            | "practice_health_reviewer"
            | "communication_drafter"
            | "query_assistant"
            | "lead_enricher"
            | "help_assistant";
          triggered_by_user_id: string | null;
          trigger_type: "manual" | "auto";
          trigger_context: Json | null;
          model: string;
          system_prompt: string | null;
          user_message: string | null;
          raw_output: string | null;
          parsed_output: Json | null;
          input_tokens: number | null;
          output_tokens: number | null;
          cost_usd: number | null;
          status: "pending" | "success" | "failed" | "cancelled";
          error_message: string | null;
          latency_ms: number | null;
          replay_of_id: string | null;
          approved_at: string | null;
          approved_by_user_id: string | null;
          applied_action: string | null;
          applied_at: string | null;
        };
        Insert: {
          id?: string;
          created_at?: string;
          agent_type:
            | "pattern_analyst"
            | "protocol_drafter"
            | "practice_health_reviewer"
            | "communication_drafter"
            | "query_assistant"
            | "lead_enricher"
            | "help_assistant";
          triggered_by_user_id?: string | null;
          trigger_type: "manual" | "auto";
          trigger_context?: Json | null;
          model: string;
          system_prompt?: string | null;
          user_message?: string | null;
          raw_output?: string | null;
          parsed_output?: Json | null;
          input_tokens?: number | null;
          output_tokens?: number | null;
          cost_usd?: number | null;
          status?: "pending" | "success" | "failed" | "cancelled";
          error_message?: string | null;
          latency_ms?: number | null;
          replay_of_id?: string | null;
          approved_at?: string | null;
          approved_by_user_id?: string | null;
          applied_action?: string | null;
          applied_at?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["agent_runs"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "agent_runs_triggered_by_user_id_fkey";
            columns: ["triggered_by_user_id"];
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "agent_runs_approved_by_user_id_fkey";
            columns: ["approved_by_user_id"];
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "agent_runs_replay_of_id_fkey";
            columns: ["replay_of_id"];
            referencedRelation: "agent_runs";
            referencedColumns: ["id"];
          },
        ];
      };
      // P13 — vendor directory (admin-only)
      vendors: {
        Row: {
          id: string;
          created_at: string;
          updated_at: string;
          name: string;
          category:
            | "manufacturer"
            | "software_vendor"
            | "service_provider"
            | "logistics"
            | "professional_services"
            | "other";
          description: string | null;
          contact_name: string | null;
          contact_email: string | null;
          contact_phone: string | null;
          messaging_handles: Json;
          website: string | null;
          account_id: string | null;
          notes: string | null;
          status: "active" | "paused" | "former";
          created_by: string | null;
          last_updated_by: string | null;
        };
        Insert: {
          id?: string;
          created_at?: string;
          updated_at?: string;
          name: string;
          category:
            | "manufacturer"
            | "software_vendor"
            | "service_provider"
            | "logistics"
            | "professional_services"
            | "other";
          description?: string | null;
          contact_name?: string | null;
          contact_email?: string | null;
          contact_phone?: string | null;
          messaging_handles?: Json;
          website?: string | null;
          account_id?: string | null;
          notes?: string | null;
          status?: "active" | "paused" | "former";
          created_by?: string | null;
          last_updated_by?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["vendors"]["Insert"]>;
        Relationships: [];
      };
      // P13 — stack reference: services + env var names (NEVER values)
      stack_services: {
        Row: {
          id: string;
          created_at: string;
          updated_at: string;
          name: string;
          category:
            | "hosting"
            | "database"
            | "auth"
            | "email"
            | "cms"
            | "ai"
            | "analytics"
            | "monitoring"
            | "storage"
            | "domain"
            | "payment"
            | "other";
          what_it_does: string;
          plan_tier: string | null;
          monthly_cost_estimate_usd: number | null;
          renewal_date: string | null;
          login_url: string | null;
          account_owner_user_id: string | null;
          credentials_storage_location: string | null;
          support_contact: string | null;
          documentation_links: string | null;
          status: "active" | "paused" | "former";
          notes: string | null;
          created_by: string | null;
          last_updated_by: string | null;
        };
        Insert: {
          id?: string;
          created_at?: string;
          updated_at?: string;
          name: string;
          category:
            | "hosting"
            | "database"
            | "auth"
            | "email"
            | "cms"
            | "ai"
            | "analytics"
            | "monitoring"
            | "storage"
            | "domain"
            | "payment"
            | "other";
          what_it_does: string;
          plan_tier?: string | null;
          monthly_cost_estimate_usd?: number | null;
          renewal_date?: string | null;
          login_url?: string | null;
          account_owner_user_id?: string | null;
          credentials_storage_location?: string | null;
          support_contact?: string | null;
          documentation_links?: string | null;
          status?: "active" | "paused" | "former";
          notes?: string | null;
          created_by?: string | null;
          last_updated_by?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["stack_services"]["Insert"]>;
        Relationships: [];
      };
      stack_env_vars: {
        Row: {
          id: string;
          created_at: string;
          service_id: string;
          var_name: string;
          description: string | null;
          set_in_vercel: boolean;
          set_in_local_env: boolean;
          is_secret: boolean;
        };
        Insert: {
          id?: string;
          created_at?: string;
          service_id: string;
          var_name: string;
          description?: string | null;
          set_in_vercel?: boolean;
          set_in_local_env?: boolean;
          is_secret?: boolean;
        };
        Update: Partial<Database["public"]["Tables"]["stack_env_vars"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "stack_env_vars_service_id_fkey";
            columns: ["service_id"];
            referencedRelation: "stack_services";
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
      // P7 — admin dashboard RPCs (defined in 0009_dashboard_rpcs.sql).
      // All return JSONB; concrete shapes live in lib/admin/dashboard.ts.
      dashboard_top_line: {
        Args: {
          range_start: string;
          range_end: string;
          comparison_start: string;
        };
        Returns: Json;
      };
      dashboard_volume_timeseries: {
        Args: {
          range_start: string;
          range_end: string;
          bucket: string;
        };
        Returns: Json;
      };
      dashboard_protocol_stats: {
        Args: { range_start: string; range_end: string };
        Returns: Json;
      };
      dashboard_protocol_coverage: {
        Args: { range_start: string; range_end: string };
        Returns: Json;
      };
      dashboard_indication_distribution: {
        Args: { range_start: string; range_end: string };
        Returns: Json;
      };
      dashboard_fitzpatrick_distribution: {
        Args: { range_start: string; range_end: string };
        Returns: Json;
      };
      dashboard_adverse_events_summary: {
        Args: { range_start: string; range_end: string };
        Returns: Json;
      };
      dashboard_recent_treatments: {
        Args: { limit_count?: number };
        Returns: Json;
      };
      // P8 — admin inbox RPCs (defined in 0010_inbox_status.sql).
      list_inbox_items: {
        Args: {
          filter_type?: string;
          filter_status?: string;
          search_query?: string | null;
          result_offset?: number;
          result_limit?: number;
        };
        Returns: Array<{
          type: string;
          id: string;
          received_at: string;
          status: string;
          status_changed_at: string | null;
          display_name: string;
          display_email: string;
          display_context: string | null;
        }>;
      };
      count_inbox_items_by_type: {
        Args: { filter_status?: string };
        Returns: Array<{ type: string; count: number }>;
      };
      count_inbox_new_items: {
        Args: Record<string, never>;
        Returns: number;
      };
      // P9.1 — per-user training/certification gate (replaces
      // is_practice_certified_for_device in 0012_per_user_certifications.sql).
      is_user_certified_for_device: {
        Args: { p_practice_user_id: string; p_device_id: string };
        Returns: boolean;
      };
      // P10 — notifications.
      get_unread_notification_count: {
        Args: Record<string, never>;
        Returns: number;
      };
      mark_all_notifications_read: {
        Args: Record<string, never>;
        Returns: void;
      };
      // P11 — AI agent observability + Query Assistant SQL exec.
      agent_cost_summary: {
        Args: { range_start: string; range_end: string };
        Returns: Array<{
          agent_type: string;
          run_count: number;
          total_input_tokens: number;
          total_output_tokens: number;
          total_cost_usd: number;
        }>;
      };
      execute_readonly_query: {
        Args: { query_text: string };
        Returns: Json[];
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
