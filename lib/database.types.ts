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
      attendance: {
        Row: { id: string; member_id: string; recorded_by: string | null; class_id: string | null; attended_on: string; status: Database["public"]["Enums"]["attendance_status"]; note: string | null; created_at: string }
        Insert: { id?: string; member_id: string; recorded_by?: string | null; class_id?: string | null; attended_on?: string; status?: Database["public"]["Enums"]["attendance_status"]; note?: string | null; created_at?: string }
        Update: { id?: string; member_id?: string; recorded_by?: string | null; class_id?: string | null; attended_on?: string; status?: Database["public"]["Enums"]["attendance_status"]; note?: string | null; created_at?: string }
        Relationships: [
          { foreignKeyName: "attendance_member_id_fkey"; columns: ["member_id"]; isOneToOne: false; referencedRelation: "profiles"; referencedColumns: ["id"] },
          { foreignKeyName: "attendance_class_id_fkey"; columns: ["class_id"]; isOneToOne: false; referencedRelation: "classes"; referencedColumns: ["id"] },
        ]
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
      client_notes: {
        Row: { trainer_id: string; client_id: string; notes: string | null; tags: string[]; updated_at: string }
        Insert: { trainer_id: string; client_id: string; notes?: string | null; tags?: string[]; updated_at?: string }
        Update: { trainer_id?: string; client_id?: string; notes?: string | null; tags?: string[]; updated_at?: string }
        Relationships: []
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
        Row: { body: string | null; created_at: string; id: string; read_at: string | null; recipient_id: string; sender_id: string; attachment_url: string | null; attachment_type: string | null; attachment_name: string | null; font: string }
        Insert: { body?: string | null; created_at?: string; id?: string; read_at?: string | null; recipient_id: string; sender_id: string; attachment_url?: string | null; attachment_type?: string | null; attachment_name?: string | null; font?: string }
        Update: { body?: string | null; created_at?: string; id?: string; read_at?: string | null; recipient_id?: string; sender_id?: string; attachment_url?: string | null; attachment_type?: string | null; attachment_name?: string | null; font?: string }
        Relationships: [
          { foreignKeyName: "messages_recipient_id_fkey"; columns: ["recipient_id"]; isOneToOne: false; referencedRelation: "profiles"; referencedColumns: ["id"] },
          { foreignKeyName: "messages_sender_id_fkey"; columns: ["sender_id"]; isOneToOne: false; referencedRelation: "profiles"; referencedColumns: ["id"] },
        ]
      }
      message_reactions: {
        Row: { id: string; message_id: string; user_id: string; emoji: string; created_at: string }
        Insert: { id?: string; message_id: string; user_id: string; emoji: string; created_at?: string }
        Update: { id?: string; message_id?: string; user_id?: string; emoji?: string; created_at?: string }
        Relationships: [
          { foreignKeyName: "message_reactions_message_id_fkey"; columns: ["message_id"]; isOneToOne: false; referencedRelation: "messages"; referencedColumns: ["id"] },
          { foreignKeyName: "message_reactions_user_id_fkey"; columns: ["user_id"]; isOneToOne: false; referencedRelation: "profiles"; referencedColumns: ["id"] },
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
        Row: { avatar_url: string | null; bio: string | null; created_at: string; email: string | null; full_name: string; goals: string | null; id: string; is_admin: boolean; phone: string | null; role: Database["public"]["Enums"]["user_role"]; specialties: string[]; updated_at: string }
        Insert: { avatar_url?: string | null; bio?: string | null; created_at?: string; email?: string | null; full_name?: string; goals?: string | null; id: string; is_admin?: boolean; phone?: string | null; role?: Database["public"]["Enums"]["user_role"]; specialties?: string[]; updated_at?: string }
        Update: { avatar_url?: string | null; bio?: string | null; created_at?: string; email?: string | null; full_name?: string; goals?: string | null; id?: string; is_admin?: boolean; phone?: string | null; role?: Database["public"]["Enums"]["user_role"]; specialties?: string[]; updated_at?: string }
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
      points_ledger: {
        Row: { id: string; user_id: string; points: number; reason: string; ref_type: string | null; ref_id: string | null; created_at: string }
        Insert: { id?: string; user_id: string; points: number; reason: string; ref_type?: string | null; ref_id?: string | null; created_at?: string }
        Update: { id?: string; user_id?: string; points?: number; reason?: string; ref_type?: string | null; ref_id?: string | null; created_at?: string }
        Relationships: [{ foreignKeyName: "points_ledger_user_id_fkey"; columns: ["user_id"]; isOneToOne: false; referencedRelation: "profiles"; referencedColumns: ["id"] }]
      }
      member_stats: {
        Row: { user_id: string; total_points: number; level: number; current_streak: number; longest_streak: number; last_checkin_date: string | null; checkins_count: number; updated_at: string }
        Insert: { user_id: string; total_points?: number; level?: number; current_streak?: number; longest_streak?: number; last_checkin_date?: string | null; checkins_count?: number; updated_at?: string }
        Update: { user_id?: string; total_points?: number; level?: number; current_streak?: number; longest_streak?: number; last_checkin_date?: string | null; checkins_count?: number; updated_at?: string }
        Relationships: [{ foreignKeyName: "member_stats_user_id_fkey"; columns: ["user_id"]; isOneToOne: true; referencedRelation: "profiles"; referencedColumns: ["id"] }]
      }
      checkins: {
        Row: { id: string; user_id: string; checkin_date: string; source: string; created_at: string }
        Insert: { id?: string; user_id: string; checkin_date?: string; source?: string; created_at?: string }
        Update: { id?: string; user_id?: string; checkin_date?: string; source?: string; created_at?: string }
        Relationships: [{ foreignKeyName: "checkins_user_id_fkey"; columns: ["user_id"]; isOneToOne: false; referencedRelation: "profiles"; referencedColumns: ["id"] }]
      }
      badges: {
        Row: { id: string; name: string; description: string; icon: string; points_reward: number; sort: number }
        Insert: { id: string; name: string; description: string; icon?: string; points_reward?: number; sort?: number }
        Update: { id?: string; name?: string; description?: string; icon?: string; points_reward?: number; sort?: number }
        Relationships: []
      }
      member_badges: {
        Row: { id: string; user_id: string; badge_id: string; earned_at: string }
        Insert: { id?: string; user_id: string; badge_id: string; earned_at?: string }
        Update: { id?: string; user_id?: string; badge_id?: string; earned_at?: string }
        Relationships: [
          { foreignKeyName: "member_badges_user_id_fkey"; columns: ["user_id"]; isOneToOne: false; referencedRelation: "profiles"; referencedColumns: ["id"] },
          { foreignKeyName: "member_badges_badge_id_fkey"; columns: ["badge_id"]; isOneToOne: false; referencedRelation: "badges"; referencedColumns: ["id"] },
        ]
      }
      friendships: {
        Row: { id: string; requester_id: string; addressee_id: string; status: string; created_at: string }
        Insert: { id?: string; requester_id: string; addressee_id: string; status?: string; created_at?: string }
        Update: { id?: string; requester_id?: string; addressee_id?: string; status?: string; created_at?: string }
        Relationships: [
          { foreignKeyName: "friendships_requester_id_fkey"; columns: ["requester_id"]; isOneToOne: false; referencedRelation: "profiles"; referencedColumns: ["id"] },
          { foreignKeyName: "friendships_addressee_id_fkey"; columns: ["addressee_id"]; isOneToOne: false; referencedRelation: "profiles"; referencedColumns: ["id"] },
        ]
      }
      activity_events: {
        Row: { id: string; user_id: string; type: string; title: string; body: string | null; visibility: string; created_at: string }
        Insert: { id?: string; user_id: string; type: string; title: string; body?: string | null; visibility?: string; created_at?: string }
        Update: { id?: string; user_id?: string; type?: string; title?: string; body?: string | null; visibility?: string; created_at?: string }
        Relationships: [{ foreignKeyName: "activity_events_user_id_fkey"; columns: ["user_id"]; isOneToOne: false; referencedRelation: "profiles"; referencedColumns: ["id"] }]
      }
      kudos: {
        Row: { id: string; activity_id: string; user_id: string; created_at: string }
        Insert: { id?: string; activity_id: string; user_id: string; created_at?: string }
        Update: { id?: string; activity_id?: string; user_id?: string; created_at?: string }
        Relationships: [
          { foreignKeyName: "kudos_activity_id_fkey"; columns: ["activity_id"]; isOneToOne: false; referencedRelation: "activity_events"; referencedColumns: ["id"] },
          { foreignKeyName: "kudos_user_id_fkey"; columns: ["user_id"]; isOneToOne: false; referencedRelation: "profiles"; referencedColumns: ["id"] },
        ]
      }
      challenges: {
        Row: { id: string; title: string; description: string | null; metric: Database["public"]["Enums"]["challenge_metric"]; starts_at: string; ends_at: string; reward_points: number; created_by: string; created_at: string }
        Insert: { id?: string; title: string; description?: string | null; metric?: Database["public"]["Enums"]["challenge_metric"]; starts_at: string; ends_at: string; reward_points?: number; created_by: string; created_at?: string }
        Update: { id?: string; title?: string; description?: string | null; metric?: Database["public"]["Enums"]["challenge_metric"]; starts_at?: string; ends_at?: string; reward_points?: number; created_by?: string; created_at?: string }
        Relationships: [{ foreignKeyName: "challenges_created_by_fkey"; columns: ["created_by"]; isOneToOne: false; referencedRelation: "profiles"; referencedColumns: ["id"] }]
      }
      challenge_participants: {
        Row: { id: string; challenge_id: string; user_id: string; joined_at: string }
        Insert: { id?: string; challenge_id: string; user_id: string; joined_at?: string }
        Update: { id?: string; challenge_id?: string; user_id?: string; joined_at?: string }
        Relationships: [
          { foreignKeyName: "challenge_participants_challenge_id_fkey"; columns: ["challenge_id"]; isOneToOne: false; referencedRelation: "challenges"; referencedColumns: ["id"] },
          { foreignKeyName: "challenge_participants_user_id_fkey"; columns: ["user_id"]; isOneToOne: false; referencedRelation: "profiles"; referencedColumns: ["id"] },
        ]
      }
      duels: {
        Row: { id: string; challenger_id: string; opponent_id: string; metric: Database["public"]["Enums"]["challenge_metric"]; starts_at: string; ends_at: string; status: Database["public"]["Enums"]["duel_status"]; winner_id: string | null; created_at: string }
        Insert: { id?: string; challenger_id: string; opponent_id: string; metric?: Database["public"]["Enums"]["challenge_metric"]; starts_at: string; ends_at: string; status?: Database["public"]["Enums"]["duel_status"]; winner_id?: string | null; created_at?: string }
        Update: { id?: string; challenger_id?: string; opponent_id?: string; metric?: Database["public"]["Enums"]["challenge_metric"]; starts_at?: string; ends_at?: string; status?: Database["public"]["Enums"]["duel_status"]; winner_id?: string | null; created_at?: string }
        Relationships: [
          { foreignKeyName: "duels_challenger_id_fkey"; columns: ["challenger_id"]; isOneToOne: false; referencedRelation: "profiles"; referencedColumns: ["id"] },
          { foreignKeyName: "duels_opponent_id_fkey"; columns: ["opponent_id"]; isOneToOne: false; referencedRelation: "profiles"; referencedColumns: ["id"] },
        ]
      }
      partner_goals: {
        Row: { id: string; title: string; metric: Database["public"]["Enums"]["challenge_metric"]; target: number; starts_at: string; ends_at: string; status: string; created_by: string; created_at: string }
        Insert: { id?: string; title: string; metric?: Database["public"]["Enums"]["challenge_metric"]; target?: number; starts_at?: string; ends_at: string; status?: string; created_by: string; created_at?: string }
        Update: { id?: string; title?: string; metric?: Database["public"]["Enums"]["challenge_metric"]; target?: number; starts_at?: string; ends_at?: string; status?: string; created_by?: string; created_at?: string }
        Relationships: [{ foreignKeyName: "partner_goals_created_by_fkey"; columns: ["created_by"]; isOneToOne: false; referencedRelation: "profiles"; referencedColumns: ["id"] }]
      }
      partner_goal_members: {
        Row: { id: string; goal_id: string; user_id: string; joined_at: string }
        Insert: { id?: string; goal_id: string; user_id: string; joined_at?: string }
        Update: { id?: string; goal_id?: string; user_id?: string; joined_at?: string }
        Relationships: [
          { foreignKeyName: "partner_goal_members_goal_id_fkey"; columns: ["goal_id"]; isOneToOne: false; referencedRelation: "partner_goals"; referencedColumns: ["id"] },
          { foreignKeyName: "partner_goal_members_user_id_fkey"; columns: ["user_id"]; isOneToOne: false; referencedRelation: "profiles"; referencedColumns: ["id"] },
        ]
      }
      posts: {
        Row: { id: string; author_id: string; kind: Database["public"]["Enums"]["post_kind"]; channel: string; body: string | null; image_url: string | null; created_at: string; updated_at: string }
        Insert: { id?: string; author_id: string; kind?: Database["public"]["Enums"]["post_kind"]; channel?: string; body?: string | null; image_url?: string | null; created_at?: string; updated_at?: string }
        Update: { id?: string; author_id?: string; kind?: Database["public"]["Enums"]["post_kind"]; channel?: string; body?: string | null; image_url?: string | null; created_at?: string; updated_at?: string }
        Relationships: [{ foreignKeyName: "posts_author_id_fkey"; columns: ["author_id"]; isOneToOne: false; referencedRelation: "profiles"; referencedColumns: ["id"] }]
      }
      post_tags: {
        Row: { id: string; post_id: string; tagged_user_id: string; created_at: string }
        Insert: { id?: string; post_id: string; tagged_user_id: string; created_at?: string }
        Update: { id?: string; post_id?: string; tagged_user_id?: string; created_at?: string }
        Relationships: [
          { foreignKeyName: "post_tags_post_id_fkey"; columns: ["post_id"]; isOneToOne: false; referencedRelation: "posts"; referencedColumns: ["id"] },
          { foreignKeyName: "post_tags_tagged_user_id_fkey"; columns: ["tagged_user_id"]; isOneToOne: false; referencedRelation: "profiles"; referencedColumns: ["id"] },
        ]
      }
      post_likes: {
        Row: { id: string; post_id: string; user_id: string; created_at: string }
        Insert: { id?: string; post_id: string; user_id: string; created_at?: string }
        Update: { id?: string; post_id?: string; user_id?: string; created_at?: string }
        Relationships: [
          { foreignKeyName: "post_likes_post_id_fkey"; columns: ["post_id"]; isOneToOne: false; referencedRelation: "posts"; referencedColumns: ["id"] },
          { foreignKeyName: "post_likes_user_id_fkey"; columns: ["user_id"]; isOneToOne: false; referencedRelation: "profiles"; referencedColumns: ["id"] },
        ]
      }
      post_comments: {
        Row: { id: string; post_id: string; author_id: string; body: string; created_at: string }
        Insert: { id?: string; post_id: string; author_id: string; body: string; created_at?: string }
        Update: { id?: string; post_id?: string; author_id?: string; body?: string; created_at?: string }
        Relationships: [
          { foreignKeyName: "post_comments_post_id_fkey"; columns: ["post_id"]; isOneToOne: false; referencedRelation: "posts"; referencedColumns: ["id"] },
          { foreignKeyName: "post_comments_author_id_fkey"; columns: ["author_id"]; isOneToOne: false; referencedRelation: "profiles"; referencedColumns: ["id"] },
        ]
      }
      comment_likes: {
        Row: { id: string; comment_id: string; user_id: string; created_at: string }
        Insert: { id?: string; comment_id: string; user_id: string; created_at?: string }
        Update: { id?: string; comment_id?: string; user_id?: string; created_at?: string }
        Relationships: [
          { foreignKeyName: "comment_likes_comment_id_fkey"; columns: ["comment_id"]; isOneToOne: false; referencedRelation: "post_comments"; referencedColumns: ["id"] },
          { foreignKeyName: "comment_likes_user_id_fkey"; columns: ["user_id"]; isOneToOne: false; referencedRelation: "profiles"; referencedColumns: ["id"] },
        ]
      }
      events: {
        Row: { id: string; created_by: string; kind: Database["public"]["Enums"]["event_kind"]; title: string; description: string | null; location: string | null; image_url: string | null; starts_at: string; ends_at: string | null; created_at: string }
        Insert: { id?: string; created_by: string; kind?: Database["public"]["Enums"]["event_kind"]; title: string; description?: string | null; location?: string | null; image_url?: string | null; starts_at: string; ends_at?: string | null; created_at?: string }
        Update: { id?: string; created_by?: string; kind?: Database["public"]["Enums"]["event_kind"]; title?: string; description?: string | null; location?: string | null; image_url?: string | null; starts_at?: string; ends_at?: string | null; created_at?: string }
        Relationships: [{ foreignKeyName: "events_created_by_fkey"; columns: ["created_by"]; isOneToOne: false; referencedRelation: "profiles"; referencedColumns: ["id"] }]
      }
      event_rsvps: {
        Row: { id: string; event_id: string; user_id: string; status: Database["public"]["Enums"]["rsvp_status"]; note: string | null; created_at: string; updated_at: string }
        Insert: { id?: string; event_id: string; user_id: string; status: Database["public"]["Enums"]["rsvp_status"]; note?: string | null; created_at?: string; updated_at?: string }
        Update: { id?: string; event_id?: string; user_id?: string; status?: Database["public"]["Enums"]["rsvp_status"]; note?: string | null; created_at?: string; updated_at?: string }
        Relationships: [
          { foreignKeyName: "event_rsvps_event_id_fkey"; columns: ["event_id"]; isOneToOne: false; referencedRelation: "events"; referencedColumns: ["id"] },
          { foreignKeyName: "event_rsvps_user_id_fkey"; columns: ["user_id"]; isOneToOne: false; referencedRelation: "profiles"; referencedColumns: ["id"] },
        ]
      }
      member_profiles: {
        Row: { user_id: string; intro: string | null; current_goal: string | null; hometown: string | null; occupation: string | null; favorite_color: string | null; favorite_food: string | null; favorite_music: string | null; favorite_decade: string | null; favorite_movie: string | null; hobbies: string | null; dream_vacation: string | null; pets: string | null; early_bird_or_night_owl: string | null; coffee_or_tea: string | null; fun_fact: string | null; favorite_workout_song: string | null; favorite_movement: string | null; favorite_training_day: string | null; updated_at: string }
        Insert: { user_id: string; intro?: string | null; current_goal?: string | null; hometown?: string | null; occupation?: string | null; favorite_color?: string | null; favorite_food?: string | null; favorite_music?: string | null; favorite_decade?: string | null; favorite_movie?: string | null; hobbies?: string | null; dream_vacation?: string | null; pets?: string | null; early_bird_or_night_owl?: string | null; coffee_or_tea?: string | null; fun_fact?: string | null; favorite_workout_song?: string | null; favorite_movement?: string | null; favorite_training_day?: string | null; updated_at?: string }
        Update: { user_id?: string; intro?: string | null; current_goal?: string | null; hometown?: string | null; occupation?: string | null; favorite_color?: string | null; favorite_food?: string | null; favorite_music?: string | null; favorite_decade?: string | null; favorite_movie?: string | null; hobbies?: string | null; dream_vacation?: string | null; pets?: string | null; early_bird_or_night_owl?: string | null; coffee_or_tea?: string | null; fun_fact?: string | null; favorite_workout_song?: string | null; favorite_movement?: string | null; favorite_training_day?: string | null; updated_at?: string }
        Relationships: [{ foreignKeyName: "member_profiles_user_id_fkey"; columns: ["user_id"]; isOneToOne: true; referencedRelation: "profiles"; referencedColumns: ["id"] }]
      }
      discussions: {
        Row: { id: string; prompt: string; details: string | null; status: string; conclusion: string | null; created_by: string; created_at: string; archived_at: string | null }
        Insert: { id?: string; prompt: string; details?: string | null; status?: string; conclusion?: string | null; created_by: string; created_at?: string; archived_at?: string | null }
        Update: { id?: string; prompt?: string; details?: string | null; status?: string; conclusion?: string | null; created_by?: string; created_at?: string; archived_at?: string | null }
        Relationships: [{ foreignKeyName: "discussions_created_by_fkey"; columns: ["created_by"]; isOneToOne: false; referencedRelation: "profiles"; referencedColumns: ["id"] }]
      }
      discussion_responses: {
        Row: { id: string; discussion_id: string; user_id: string; body: string; created_at: string }
        Insert: { id?: string; discussion_id: string; user_id: string; body: string; created_at?: string }
        Update: { id?: string; discussion_id?: string; user_id?: string; body?: string; created_at?: string }
        Relationships: [
          { foreignKeyName: "discussion_responses_discussion_id_fkey"; columns: ["discussion_id"]; isOneToOne: false; referencedRelation: "discussions"; referencedColumns: ["id"] },
          { foreignKeyName: "discussion_responses_user_id_fkey"; columns: ["user_id"]; isOneToOne: false; referencedRelation: "profiles"; referencedColumns: ["id"] },
        ]
      }
      discussion_response_likes: {
        Row: { id: string; response_id: string; user_id: string; created_at: string }
        Insert: { id?: string; response_id: string; user_id: string; created_at?: string }
        Update: { id?: string; response_id?: string; user_id?: string; created_at?: string }
        Relationships: [
          { foreignKeyName: "discussion_response_likes_response_id_fkey"; columns: ["response_id"]; isOneToOne: false; referencedRelation: "discussion_responses"; referencedColumns: ["id"] },
          { foreignKeyName: "discussion_response_likes_user_id_fkey"; columns: ["user_id"]; isOneToOne: false; referencedRelation: "profiles"; referencedColumns: ["id"] },
        ]
      }
      feedback: {
        Row: { id: string; from_user_id: string | null; is_anonymous: boolean; audience: string; trainer_id: string | null; category: string | null; body: string; status: string; created_at: string }
        Insert: { id?: string; from_user_id?: string | null; is_anonymous?: boolean; audience: string; trainer_id?: string | null; category?: string | null; body: string; status?: string; created_at?: string }
        Update: { id?: string; from_user_id?: string | null; is_anonymous?: boolean; audience?: string; trainer_id?: string | null; category?: string | null; body?: string; status?: string; created_at?: string }
        Relationships: [
          { foreignKeyName: "feedback_from_user_id_fkey"; columns: ["from_user_id"]; isOneToOne: false; referencedRelation: "profiles"; referencedColumns: ["id"] },
          { foreignKeyName: "feedback_trainer_id_fkey"; columns: ["trainer_id"]; isOneToOne: false; referencedRelation: "profiles"; referencedColumns: ["id"] },
        ]
      }
      support_tickets: {
        Row: { id: string; user_id: string; category: string; subject: string; summary: string; details: string | null; urgency: string; status: string; created_at: string }
        Insert: { id?: string; user_id: string; category: string; subject: string; summary: string; details?: string | null; urgency?: string; status?: string; created_at?: string }
        Update: { id?: string; user_id?: string; category?: string; subject?: string; summary?: string; details?: string | null; urgency?: string; status?: string; created_at?: string }
        Relationships: [{ foreignKeyName: "support_tickets_user_id_fkey"; columns: ["user_id"]; isOneToOne: false; referencedRelation: "profiles"; referencedColumns: ["id"] }]
      }
    }
    Views: { [_ in never]: never }
    Functions: {
      current_user_role: { Args: never; Returns: Database["public"]["Enums"]["user_role"] }
      generate_class_schedule: { Args: { p_days: number }; Returns: number }
      is_admin: { Args: never; Returns: boolean }
      notify: { Args: { nbody: string; nlink: string; ntitle: string; ntype: string; target: string }; Returns: undefined }
      do_checkin: { Args: never; Returns: Json }
      is_staff: { Args: never; Returns: boolean }
      record_attendance: { Args: { p_member: string; p_status: Database["public"]["Enums"]["attendance_status"]; p_class?: string | null; p_date?: string; p_note?: string | null }; Returns: Json }
      trainer_busy_blocks: { Args: { p_trainer: string; p_from: string; p_to: string }; Returns: { starts_at: string; ends_at: string }[] }
      trainer_has_conflict: { Args: { p_trainer: string; p_start: string; p_end: string }; Returns: boolean }
      give_kudos: { Args: { p_activity: string }; Returns: undefined }
      settle_duel: { Args: { did: string }; Returns: undefined }
      challenge_leaderboard: { Args: { cid: string }; Returns: { user_id: string; full_name: string; score: number }[] }
      duel_scores: { Args: { did: string }; Returns: { challenger_score: number; opponent_score: number }[] }
      partner_goal_progress: { Args: { gid: string }; Returns: number }
    }
    Enums: {
      assignment_status: "active" | "completed" | "paused"
      attendance_status: "present" | "no_show" | "cancelled" | "late_cancel" | "excused"
      class_booking_status: "booked" | "waitlisted" | "cancelled" | "attended"
      challenge_metric: "checkins" | "sessions" | "classes" | "workouts" | "points"
      duel_status: "pending" | "active" | "completed" | "declined" | "cancelled"
      event_kind: "gym" | "social"
      goal_status: "active" | "achieved" | "archived"
      invoice_status: "due" | "paid" | "void"
      package_status: "active" | "expired" | "cancelled"
      post_kind: "post" | "shoutout" | "congrats" | "thank_you" | "milestone" | "announcement"
      relationship_status: "active" | "inactive"
      rsvp_status: "going" | "maybe" | "cant"
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

export type ChallengeMetric = Database["public"]["Enums"]["challenge_metric"];
export type DuelStatus = Database["public"]["Enums"]["duel_status"];
export type MemberStats = Tbl["member_stats"]["Row"];
export type PointsLedger = Tbl["points_ledger"]["Row"];
export type Checkin = Tbl["checkins"]["Row"];
export type Badge = Tbl["badges"]["Row"];
export type MemberBadge = Tbl["member_badges"]["Row"];
export type Friendship = Tbl["friendships"]["Row"];
export type ActivityEvent = Tbl["activity_events"]["Row"];
export type Kudos = Tbl["kudos"]["Row"];
export type Challenge = Tbl["challenges"]["Row"];
export type ChallengeParticipant = Tbl["challenge_participants"]["Row"];
export type Duel = Tbl["duels"]["Row"];
export type PartnerGoal = Tbl["partner_goals"]["Row"];
export type PartnerGoalMember = Tbl["partner_goal_members"]["Row"];
export type PostKind = Database["public"]["Enums"]["post_kind"];
export type Post = Tbl["posts"]["Row"];
export type PostTag = Tbl["post_tags"]["Row"];
export type PostLike = Tbl["post_likes"]["Row"];
export type PostComment = Tbl["post_comments"]["Row"];
export type CommentLike = Tbl["comment_likes"]["Row"];
export type EventKind = Database["public"]["Enums"]["event_kind"];
export type RsvpStatus = Database["public"]["Enums"]["rsvp_status"];
export type GymEvent = Tbl["events"]["Row"];
export type EventRsvp = Tbl["event_rsvps"]["Row"];
export type MemberProfile = Tbl["member_profiles"]["Row"];
