export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  __InternalSupabase: { PostgrestVersion: "14.5" }
  public: {
    Tables: {
      announcements: {
        Row: { author_id: string; body: string; created_at: string; id: string; title: string }
        Insert: { author_id: string; body: string; created_at?: string; id?: string; title: string }
        Update: { author_id?: string; body?: string; created_at?: string; id?: string; title?: string }
        Relationships: [{ foreignKeyName: "announcements_author_id_fkey"; columns: ["author_id"]; isOneToOne: false; referencedRelation: "profiles"; referencedColumns: ["id"] }]
      }
      availability: {
        Row: { created_at: string; end_time: string; id: string; start_time: string; trainer_id: string; weekday: number }
        Insert: { created_at?: string; end_time: string; id?: string; start_time: string; trainer_id: string; weekday: number }
        Update: { created_at?: string; end_time?: string; id?: string; start_time?: string; trainer_id?: string; weekday?: number }
        Relationships: [{ foreignKeyName: "availability_trainer_id_fkey"; columns: ["trainer_id"]; isOneToOne: false; referencedRelation: "profiles"; referencedColumns: ["id"] }]
      }
      class_bookings: {
        Row: { class_id: string; client_id: string; created_at: string; id: string; status: Database["public"]["Enums"]["class_booking_status"] }
        Insert: { class_id: string; client_id: string; created_at?: string; id?: string; status?: Database["public"]["Enums"]["class_booking_status"] }
        Update: { class_id?: string; client_id?: string; created_at?: string; id?: string; status?: Database["public"]["Enums"]["class_booking_status"] }
        Relationships: [
          { foreignKeyName: "class_bookings_class_id_fkey"; columns: ["class_id"]; isOneToOne: false; referencedRelation: "classes"; referencedColumns: ["id"] },
          { foreignKeyName: "class_bookings_client_id_fkey"; columns: ["client_id"]; isOneToOne: false; referencedRelation: "profiles"; referencedColumns: ["id"] },
        ]
      }
      classes: {
        Row: { capacity: number; created_at: string; description: string | null; ends_at: string; id: string; location: string | null; starts_at: string; title: string; trainer_id: string }
        Insert: { capacity?: number; created_at?: string; description?: string | null; ends_at: string; id?: string; location?: string | null; starts_at: string; title: string; trainer_id: string }
        Update: { capacity?: number; created_at?: string; description?: string | null; ends_at?: string; id?: string; location?: string | null; starts_at?: string; title?: string; trainer_id?: string }
        Relationships: [{ foreignKeyName: "classes_trainer_id_fkey"; columns: ["trainer_id"]; isOneToOne: false; referencedRelation: "profiles"; referencedColumns: ["id"] }]
      }
      client_packages: {
        Row: { client_id: string; id: string; name: string; package_id: string | null; price_cents: number; purchased_at: string; sessions_total: number; sessions_used: number; status: Database["public"]["Enums"]["package_status"]; trainer_id: string }
        Insert: { client_id: string; id?: string; name: string; package_id?: string | null; price_cents?: number; purchased_at?: string; sessions_total?: number; sessions_used?: number; status?: Database["public"]["Enums"]["package_status"]; trainer_id: string }
        Update: { client_id?: string; id?: string; name?: string; package_id?: string | null; price_cents?: number; purchased_at?: string; sessions_total?: number; sessions_used?: number; status?: Database["public"]["Enums"]["package_status"]; trainer_id?: string }
        Relationships: [
          { foreignKeyName: "client_packages_client_id_fkey"; columns: ["client_id"]; isOneToOne: false; referencedRelation: "profiles"; referencedColumns: ["id"] },
          { foreignKeyName: "client_packages_package_id_fkey"; columns: ["package_id"]; isOneToOne: false; referencedRelation: "packages"; referencedColumns: ["id"] },
          { foreignKeyName: "client_packages_trainer_id_fkey"; columns: ["trainer_id"]; isOneToOne: false; referencedRelation: "profiles"; referencedColumns: ["id"] },
        ]
      }
      client_progress: {
        Row: { arms_cm: number | null; body_fat_pct: number | null; chest_cm: number | null; client_id: string; created_at: string; hips_cm: number | null; id: string; metrics: Json; notes: string | null; recorded_at: string; recorded_by: string; thighs_cm: number | null; waist_cm: number | null; weight_kg: number | null }
        Insert: { arms_cm?: number | null; body_fat_pct?: number | null; chest_cm?: number | null; client_id: string; created_at?: string; hips_cm?: number | null; id?: string; metrics?: Json; notes?: string | null; recorded_at?: string; recorded_by: string; thighs_cm?: number | null; waist_cm?: number | null; weight_kg?: number | null }
        Update: { arms_cm?: number | null; body_fat_pct?: number | null; chest_cm?: number | null; client_id?: string; created_at?: string; hips_cm?: number | null; id?: string; metrics?: Json; notes?: string | null; recorded_at?: string; recorded_by?: string; thighs_cm?: number | null; waist_cm?: number | null; weight_kg?: number | null }
        Relationships: [
          { foreignKeyName: "client_progress_client_id_fkey"; columns: ["client_id"]; isOneToOne: false; referencedRelation: "profiles"; referencedColumns: ["id"] },
          { foreignKeyName: "client_progress_recorded_by_fkey"; columns: ["recorded_by"]; isOneToOne: false; referencedRelation: "profiles"; referencedColumns: ["id"] },
        ]
      }
      exercises: {
        Row: { category: string | null; created_at: string; created_by: string; description: string | null; equipment: string | null; id: string; is_public: boolean; muscle_group: string | null; name: string; video_url: string | null }
        Insert: { category?: string | null; created_at?: string; created_by: string; description?: string | null; equipment?: string | null; id?: string; is_public?: boolean; muscle_group?: string | null; name: string; video_url?: string | null }
        Update: { category?: string | null; created_at?: string; created_by?: string; description?: string | null; equipment?: string | null; id?: string; is_public?: boolean; muscle_group?: string | null; name?: string; video_url?: string | null }
        Relationships: [{ foreignKeyName: "exercises_created_by_fkey"; columns: ["created_by"]; isOneToOne: false; referencedRelation: "profiles"; referencedColumns: ["id"] }]
      }
      goals: {
        Row: { client_id: string; created_at: string; current_value: number | null; description: string | null; id: string; metric: string | null; start_value: number | null; status: Database["public"]["Enums"]["goal_status"]; target_date: string | null; target_value: number | null; title: string; trainer_id: string | null; unit: string | null }
        Insert: { client_id: string; created_at?: string; current_value?: number | null; description?: string | null; id?: string; metric?: string | null; start_value?: number | null; status?: Database["public"]["Enums"]["goal_status"]; target_date?: string | null; target_value?: number | null; title: string; trainer_id?: string | null; unit?: string | null }
        Update: { client_id?: string; created_at?: string; current_value?: number | null; description?: string | null; id?: string; metric?: string | null; start_value?: number | null; status?: Database["public"]["Enums"]["goal_status"]; target_date?: string | null; target_value?: number | null; title?: string; trainer_id?: string | null; unit?: string | null }
        Relationships: [
          { foreignKeyName: "goals_client_id_fkey"; columns: ["client_id"]; isOneToOne: false; referencedRelation: "profiles"; referencedColumns: ["id"] },
          { foreignKeyName: "goals_trainer_id_fkey"; columns: ["trainer_id"]; isOneToOne: false; referencedRelation: "profiles"; referencedColumns: ["id"] },
        ]
      }
      invoices: {
        Row: { amount_cents: number; client_id: string; description: string; due_date: string | null; id: string; issued_at: string; paid_at: string | null; status: Database["public"]["Enums"]["invoice_status"]; trainer_id: string }
        Insert: { amount_cents?: number; client_id: string; description: string; due_date?: string | null; id?: string; issued_at?: string; paid_at?: string | null; status?: Database["public"]["Enums"]["invoice_status"]; trainer_id: string }
        Update: { amount_cents?: number; client_id?: string; description?: string; due_date?: string | null; id?: string; issued_at?: string; paid_at?: string | null; status?: Database["public"]["Enums"]["invoice_status"]; trainer_id?: string }
        Relationships: [
          { foreignKeyName: "invoices_client_id_fkey"; columns: ["client_id"]; isOneToOne: false; referencedRelation: "profiles"; referencedColumns: ["id"] },
          { foreignKeyName: "invoices_trainer_id_fkey"; columns: ["trainer_id"]; isOneToOne: false; referencedRelation: "profiles"; referencedColumns: ["id"] },
        ]
      }
      messages: {
        Row: { body: string; created_at: string; id: string; read_at: string | null; recipient_id: string; sender_id: string }
        Insert: { body: string; created_at?: string; id?: string; read_at?: string | null; recipient_id: string; sender_id: string }
        Update: { body?: string; created_at?: string; id?: string; read_at?: string | null; recipient_id?: string; sender_id?: string }
        Relationships: [
          { foreignKeyName: "messages_recipient_id_fkey"; columns: ["recipient_id"]; isOneToOne: false; referencedRelation: "profiles"; referencedColumns: ["id"] },
          { foreignKeyName: "messages_sender_id_fkey"; columns: ["sender_id"]; isOneToOne: false; referencedRelation: "profiles"; referencedColumns: ["id"] },
        ]
      }
      notifications: {
        Row: { body: string | null; created_at: string; id: string; link: string | null; read_at: string | null; title: string; type: string; user_id: string }
        Insert: { body?: string | null; created_at?: string; id?: string; link?: string | null; read_at?: string | null; title: string; type?: string; user_id: string }
        Update: { body?: string | null; created_at?: string; id?: string; link?: string | null; read_at?: string | null; title?: string; type?: string; user_id?: string }
        Relationships: [{ foreignKeyName: "notifications_user_id_fkey"; columns: ["user_id"]; isOneToOne: false; referencedRelation: "profiles"; referencedColumns: ["id"] }]
      }
      packages: {
        Row: { active: boolean; created_at: string; description: string | null; id: string; name: string; price_cents: number; sessions_count: number; trainer_id: string }
        Insert: { active?: boolean; created_at?: string; description?: string | null; id?: string; name: string; price_cents?: number; sessions_count?: number; trainer_id: string }
        Update: { active?: boolean; created_at?: string; description?: string | null; id?: string; name?: string; price_cents?: number; sessions_count?: number; trainer_id?: string }
        Relationships: [{ foreignKeyName: "packages_trainer_id_fkey"; columns: ["trainer_id"]; isOneToOne: false; referencedRelation: "profiles"; referencedColumns: ["id"] }]
      }
      profiles: {
        Row: { avatar_url: string | null; bio: string | null; created_at: string; email: string | null; full_name: string; goals: string | null; id: string; is_admin: boolean; phone: string | null; role: Database["public"]["Enums"]["user_role"]; updated_at: string }
        Insert: { avatar_url?: string | null; bio?: string | null; created_at?: string; email?: string | null; full_name?: string; goals?: string | null; id: string; is_admin?: boolean; phone?: string | null; role?: Database["public"]["Enums"]["user_role"]; updated_at?: string }
        Update: { avatar_url?: string | null; bio?: string | null; created_at?: string; email?: string | null; full_name?: string; goals?: string | null; id?: string; is_admin?: boolean; phone?: string | null; role?: Database["public"]["Enums"]["user_role"]; updated_at?: string }
        Relationships: []
      }
      gym_settings: {
        Row: { id: boolean; name: string; tagline: string | null; email: string | null; phone: string | null; address: string | null; city: string | null; timezone: string; currency: string; booking_window_days: number; cancel_cutoff_hours: number; updated_at: string }
        Insert: { id?: boolean; name?: string; tagline?: string | null; email?: string | null; phone?: string | null; address?: string | null; city?: string | null; timezone?: string; currency?: string; booking_window_days?: number; cancel_cutoff_hours?: number; updated_at?: string }
        Update: { id?: boolean; name?: string; tagline?: string | null; email?: string | null; phone?: string | null; address?: string | null; city?: string | null; timezone?: string; currency?: string; booking_window_days?: number; cancel_cutoff_hours?: number; updated_at?: string }
        Relationships: []
      }
      sessions: {
        Row: { client_id: string | null; created_at: string; created_by: string; ends_at: string; id: string; location: string | null; notes: string | null; starts_at: string; status: Database["public"]["Enums"]["session_status"]; title: string; trainer_id: string }
        Insert: { client_id?: string | null; created_at?: string; created_by: string; ends_at: string; id?: string; location?: string | null; notes?: string | null; starts_at: string; status?: Database["public"]["Enums"]["session_status"]; title?: string; trainer_id: string }
        Update: { client_id?: string | null; created_at?: string; created_by?: string; ends_at?: string; id?: string; location?: string | null; notes?: string | null; starts_at?: string; status?: Database["public"]["Enums"]["session_status"]; title?: string; trainer_id?: string }
        Relationships: [
          { foreignKeyName: "sessions_client_id_fkey"; columns: ["client_id"]; isOneToOne: false; referencedRelation: "profiles"; referencedColumns: ["id"] },
          { foreignKeyName: "sessions_created_by_fkey"; columns: ["created_by"]; isOneToOne: false; referencedRelation: "profiles"; referencedColumns: ["id"] },
          { foreignKeyName: "sessions_trainer_id_fkey"; columns: ["trainer_id"]; isOneToOne: false; referencedRelation: "profiles"; referencedColumns: ["id"] },
        ]
      }
      trainer_clients: {
        Row: { client_id: string; created_at: string; id: string; status: Database["public"]["Enums"]["relationship_status"]; trainer_id: string }
        Insert: { client_id: string; created_at?: string; id?: string; status?: Database["public"]["Enums"]["relationship_status"]; trainer_id: string }
        Update: { client_id?: string; created_at?: string; id?: string; status?: Database["public"]["Enums"]["relationship_status"]; trainer_id?: string }
        Relationships: [
          { foreignKeyName: "trainer_clients_client_id_fkey"; columns: ["client_id"]; isOneToOne: false; referencedRelation: "profiles"; referencedColumns: ["id"] },
          { foreignKeyName: "trainer_clients_trainer_id_fkey"; columns: ["trainer_id"]; isOneToOne: false; referencedRelation: "profiles"; referencedColumns: ["id"] },
        ]
      }
      workout_assignments: {
        Row: { client_id: string; created_at: string; id: string; plan_id: string; start_date: string; status: Database["public"]["Enums"]["assignment_status"]; trainer_id: string }
        Insert: { client_id: string; created_at?: string; id?: string; plan_id: string; start_date?: string; status?: Database["public"]["Enums"]["assignment_status"]; trainer_id: string }
        Update: { client_id?: string; created_at?: string; id?: string; plan_id?: string; start_date?: string; status?: Database["public"]["Enums"]["assignment_status"]; trainer_id?: string }
        Relationships: [
          { foreignKeyName: "workout_assignments_client_id_fkey"; columns: ["client_id"]; isOneToOne: false; referencedRelation: "profiles"; referencedColumns: ["id"] },
          { foreignKeyName: "workout_assignments_plan_id_fkey"; columns: ["plan_id"]; isOneToOne: false; referencedRelation: "workout_plans"; referencedColumns: ["id"] },
          { foreignKeyName: "workout_assignments_trainer_id_fkey"; columns: ["trainer_id"]; isOneToOne: false; referencedRelation: "profiles"; referencedColumns: ["id"] },
        ]
      }
      workout_logs: {
        Row: { assignment_id: string; client_id: string; created_at: string; id: string; notes: string | null; performed_on: string; plan_item_id: string | null; reps_done: string | null; sets_done: number | null; weight_kg: number | null }
        Insert: { assignment_id: string; client_id: string; created_at?: string; id?: string; notes?: string | null; performed_on?: string; plan_item_id?: string | null; reps_done?: string | null; sets_done?: number | null; weight_kg?: number | null }
        Update: { assignment_id?: string; client_id?: string; created_at?: string; id?: string; notes?: string | null; performed_on?: string; plan_item_id?: string | null; reps_done?: string | null; sets_done?: number | null; weight_kg?: number | null }
        Relationships: [
          { foreignKeyName: "workout_logs_assignment_id_fkey"; columns: ["assignment_id"]; isOneToOne: false; referencedRelation: "workout_assignments"; referencedColumns: ["id"] },
          { foreignKeyName: "workout_logs_client_id_fkey"; columns: ["client_id"]; isOneToOne: false; referencedRelation: "profiles"; referencedColumns: ["id"] },
          { foreignKeyName: "workout_logs_plan_item_id_fkey"; columns: ["plan_item_id"]; isOneToOne: false; referencedRelation: "workout_plan_items"; referencedColumns: ["id"] },
        ]
      }
      workout_plan_items: {
        Row: { day_label: string; exercise_id: string | null; exercise_name: string; id: string; notes: string | null; plan_id: string; position: number; reps: string | null; rest_seconds: number | null; sets: number | null }
        Insert: { day_label?: string; exercise_id?: string | null; exercise_name?: string; id?: string; notes?: string | null; plan_id: string; position?: number; reps?: string | null; rest_seconds?: number | null; sets?: number | null }
        Update: { day_label?: string; exercise_id?: string | null; exercise_name?: string; id?: string; notes?: string | null; plan_id?: string; position?: number; reps?: string | null; rest_seconds?: number | null; sets?: number | null }
        Relationships: [
          { foreignKeyName: "workout_plan_items_exercise_id_fkey"; columns: ["exercise_id"]; isOneToOne: false; referencedRelation: "exercises"; referencedColumns: ["id"] },
          { foreignKeyName: "workout_plan_items_plan_id_fkey"; columns: ["plan_id"]; isOneToOne: false; referencedRelation: "workout_plans"; referencedColumns: ["id"] },
        ]
      }
      workout_plans: {
        Row: { created_at: string; description: string | null; id: string; name: string; trainer_id: string; weeks: number }
        Insert: { created_at?: string; description?: string | null; id?: string; name: string; trainer_id: string; weeks?: number }
        Update: { created_at?: string; description?: string | null; id?: string; name?: string; trainer_id?: string; weeks?: number }
        Relationships: [{ foreignKeyName: "workout_plans_trainer_id_fkey"; columns: ["trainer_id"]; isOneToOne: false; referencedRelation: "profiles"; referencedColumns: ["id"] }]
      }
    }
    Views: { [_ in never]: never }
    Functions: {
      current_user_role: { Args: never; Returns: Database["public"]["Enums"]["user_role"] }
      generate_class_schedule: { Args: { p_days: number }; Returns: number }
      is_admin: { Args: never; Returns: boolean }
      notify: { Args: { nbody: string; nlink: string; ntitle: string; ntype: string; target: string }; Returns: undefined }
    }
    Enums: {
      assignment_status: "active" | "completed" | "paused"
      class_booking_status: "booked" | "waitlisted" | "cancelled" | "attended"
      goal_status: "active" | "achieved" | "archived"
      invoice_status: "due" | "paid" | "void"
      package_status: "active" | "expired" | "cancelled"
      relationship_status: "active" | "inactive"
      session_status: "scheduled" | "completed" | "cancelled" | "no_show"
      user_role: "trainer" | "client"
    }
    CompositeTypes: { [_ in never]: never }
  }
}

type Tbl = Database["public"]["Tables"];

// Convenience aliases used throughout the app.
export type UserRole = Database["public"]["Enums"]["user_role"];
export type SessionStatus = Database["public"]["Enums"]["session_status"];
export type RelationshipStatus = Database["public"]["Enums"]["relationship_status"];
export type AssignmentStatus = Database["public"]["Enums"]["assignment_status"];
export type ClassBookingStatus = Database["public"]["Enums"]["class_booking_status"];
export type GoalStatus = Database["public"]["Enums"]["goal_status"];
export type InvoiceStatus = Database["public"]["Enums"]["invoice_status"];
export type PackageStatus = Database["public"]["Enums"]["package_status"];

export type Profile = Tbl["profiles"]["Row"];
export type TrainerClient = Tbl["trainer_clients"]["Row"];
export type Availability = Tbl["availability"]["Row"];
export type Session = Tbl["sessions"]["Row"];
export type Message = Tbl["messages"]["Row"];
export type Announcement = Tbl["announcements"]["Row"];
export type ClientProgress = Tbl["client_progress"]["Row"];
export type Exercise = Tbl["exercises"]["Row"];
export type WorkoutPlan = Tbl["workout_plans"]["Row"];
export type WorkoutPlanItem = Tbl["workout_plan_items"]["Row"];
export type WorkoutAssignment = Tbl["workout_assignments"]["Row"];
export type WorkoutLog = Tbl["workout_logs"]["Row"];
export type Goal = Tbl["goals"]["Row"];
export type GymClass = Tbl["classes"]["Row"];
export type ClassBooking = Tbl["class_bookings"]["Row"];
export type Package = Tbl["packages"]["Row"];
export type ClientPackage = Tbl["client_packages"]["Row"];
export type Invoice = Tbl["invoices"]["Row"];
export type Notification = Tbl["notifications"]["Row"];
export type GymSettings = Tbl["gym_settings"]["Row"];
