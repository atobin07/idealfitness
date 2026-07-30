export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      announcements: {
        Row: {
          author_id: string
          body: string
          created_at: string
          id: string
          title: string
        }
        Insert: {
          author_id: string
          body: string
          created_at?: string
          id?: string
          title: string
        }
        Update: {
          author_id?: string
          body?: string
          created_at?: string
          id?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "announcements_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      availability: {
        Row: {
          created_at: string
          end_time: string
          id: string
          start_time: string
          trainer_id: string
          weekday: number
        }
        Insert: {
          created_at?: string
          end_time: string
          id?: string
          start_time: string
          trainer_id: string
          weekday: number
        }
        Update: {
          created_at?: string
          end_time?: string
          id?: string
          start_time?: string
          trainer_id?: string
          weekday?: number
        }
        Relationships: [
          {
            foreignKeyName: "availability_trainer_id_fkey"
            columns: ["trainer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      client_progress: {
        Row: {
          body_fat_pct: number | null
          client_id: string
          created_at: string
          id: string
          metrics: Json
          notes: string | null
          recorded_at: string
          recorded_by: string
          weight_kg: number | null
        }
        Insert: {
          body_fat_pct?: number | null
          client_id: string
          created_at?: string
          id?: string
          metrics?: Json
          notes?: string | null
          recorded_at?: string
          recorded_by: string
          weight_kg?: number | null
        }
        Update: {
          body_fat_pct?: number | null
          client_id?: string
          created_at?: string
          id?: string
          metrics?: Json
          notes?: string | null
          recorded_at?: string
          recorded_by?: string
          weight_kg?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "client_progress_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_progress_recorded_by_fkey"
            columns: ["recorded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          body: string
          created_at: string
          id: string
          read_at: string | null
          recipient_id: string
          sender_id: string
        }
        Insert: {
          body: string
          created_at?: string
          id?: string
          read_at?: string | null
          recipient_id: string
          sender_id: string
        }
        Update: {
          body?: string
          created_at?: string
          id?: string
          read_at?: string | null
          recipient_id?: string
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_recipient_id_fkey"
            columns: ["recipient_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string
          email: string | null
          full_name: string
          goals: string | null
          id: string
          phone: string | null
          role: Database["public"]["Enums"]["user_role"]
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          email?: string | null
          full_name?: string
          goals?: string | null
          id: string
          phone?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          email?: string | null
          full_name?: string
          goals?: string | null
          id?: string
          phone?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
        }
        Relationships: []
      }
      sessions: {
        Row: {
          client_id: string | null
          created_at: string
          created_by: string
          ends_at: string
          id: string
          location: string | null
          notes: string | null
          starts_at: string
          status: Database["public"]["Enums"]["session_status"]
          title: string
          trainer_id: string
        }
        Insert: {
          client_id?: string | null
          created_at?: string
          created_by: string
          ends_at: string
          id?: string
          location?: string | null
          notes?: string | null
          starts_at: string
          status?: Database["public"]["Enums"]["session_status"]
          title?: string
          trainer_id: string
        }
        Update: {
          client_id?: string | null
          created_at?: string
          created_by?: string
          ends_at?: string
          id?: string
          location?: string | null
          notes?: string | null
          starts_at?: string
          status?: Database["public"]["Enums"]["session_status"]
          title?: string
          trainer_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "sessions_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sessions_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sessions_trainer_id_fkey"
            columns: ["trainer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      trainer_clients: {
        Row: {
          client_id: string
          created_at: string
          id: string
          status: Database["public"]["Enums"]["relationship_status"]
          trainer_id: string
        }
        Insert: {
          client_id: string
          created_at?: string
          id?: string
          status?: Database["public"]["Enums"]["relationship_status"]
          trainer_id: string
        }
        Update: {
          client_id?: string
          created_at?: string
          id?: string
          status?: Database["public"]["Enums"]["relationship_status"]
          trainer_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "trainer_clients_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trainer_clients_trainer_id_fkey"
            columns: ["trainer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      current_user_role: {
        Args: never
        Returns: Database["public"]["Enums"]["user_role"]
      }
    }
    Enums: {
      relationship_status: "active" | "inactive"
      session_status: "scheduled" | "completed" | "cancelled" | "no_show"
      user_role: "trainer" | "client"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

// ---------------------------------------------------------------------------
// Convenience aliases used throughout the app.
// ---------------------------------------------------------------------------
export type UserRole = Database["public"]["Enums"]["user_role"];
export type SessionStatus = Database["public"]["Enums"]["session_status"];
export type RelationshipStatus = Database["public"]["Enums"]["relationship_status"];

export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type TrainerClient = Database["public"]["Tables"]["trainer_clients"]["Row"];
export type Availability = Database["public"]["Tables"]["availability"]["Row"];
export type Session = Database["public"]["Tables"]["sessions"]["Row"];
export type Message = Database["public"]["Tables"]["messages"]["Row"];
export type Announcement = Database["public"]["Tables"]["announcements"]["Row"];
export type ClientProgress = Database["public"]["Tables"]["client_progress"]["Row"];
