import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL || "https://placeholder.supabase.co";
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || "placeholder-anon-key";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "placeholder-service-role-key";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

export interface Database {
  public: {
    Tables: {
      students: {
        Row: {
          id: string;
          guarani_id: string | null;
          name: string;
          email: string;
          dni: string | null;
          role: "estudiante" | "coordinador" | "admin" | "sysadmin";
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["students"]["Row"], "id" | "created_at" | "updated_at">;
        Update: Partial<Database["public"]["Tables"]["students"]["Insert"]>;
      };
      tracks: {
        Row: {
          id: string;
          name: string;
          code: string;
          description: string | null;
          credits_required: number;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["tracks"]["Row"], "id" | "created_at" | "updated_at">;
        Update: Partial<Database["public"]["Tables"]["tracks"]["Insert"]>;
      };
      courses: {
        Row: {
          id: string;
          track_id: string;
          name: string;
          code: string;
          credits: number;
          moodle_course_id: string | null;
          is_integrator_exam: boolean;
          order_index: number;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["courses"]["Row"], "id" | "created_at" | "updated_at">;
        Update: Partial<Database["public"]["Tables"]["courses"]["Insert"]>;
      };
      certificates: {
        Row: {
          id: string;
          student_id: string;
          course_id: string;
          moodle_certificate_id: string | null;
          issue_date: string;
          status: "approved" | "pending" | "rejected";
          qualification: number | null;
          is_valid: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["certificates"]["Row"], "id" | "created_at" | "updated_at">;
        Update: Partial<Database["public"]["Tables"]["certificates"]["Insert"]>;
      };
      enrollments: {
        Row: {
          id: string;
          student_id: string;
          course_id: string;
          track_id: string;
          status: "pending" | "in_progress" | "completed";
          enrollment_date: string | null;
          completion_date: string | null;
          qualification: number | null;
          observations: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["enrollments"]["Row"], "id" | "created_at" | "updated_at">;
        Update: Partial<Database["public"]["Tables"]["enrollments"]["Insert"]>;
      };
      prerequisite_rules: {
        Row: {
          id: string;
          target_course_id: string;
          condition: "ALL" | "ANY";
          is_active: boolean;
          created_by: string;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["prerequisite_rules"]["Row"], "id" | "created_at" | "updated_at">;
        Update: Partial<Database["public"]["Tables"]["prerequisite_rules"]["Insert"]>;
      };
      prerequisite_sources: {
        Row: {
          rule_id: string;
          source_course_id: string;
        };
        Insert: Database["public"]["Tables"]["prerequisite_sources"]["Row"];
        Update: Partial<Database["public"]["Tables"]["prerequisite_sources"]["Insert"]>;
      };
      manual_overrides: {
        Row: {
          id: string;
          student_id: string;
          course_id: string | null;
          action: "enable" | "disable";
          reason: string;
          created_by: string;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["manual_overrides"]["Row"], "id" | "created_at">;
        Update: Partial<Database["public"]["Tables"]["manual_overrides"]["Insert"]>;
      };
      integration_logs: {
        Row: {
          id: string;
          integration_type: "moodle" | "guarani";
          operation: "sync" | "fetch" | "push";
          status: "success" | "error" | "pending";
          message: string | null;
          details: Record<string, unknown> | null;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["integration_logs"]["Row"], "id" | "created_at">;
        Update: Partial<Database["public"]["Tables"]["integration_logs"]["Insert"]>;
      };
    };
  };
}