export type UserRole = "trainer" | "client";
export type SessionStatus =
  | "scheduled"
  | "completed"
  | "cancelled"
  | "no_show";
export type RelationshipStatus = "active" | "inactive";

// Declared as `type` (not `interface`) so they carry the implicit index
// signature Supabase's generic table constraint requires.
export type Profile = {
  id: string;
  role: UserRole;
  full_name: string;
  email: string | null;
  phone: string | null;
  avatar_url: string | null;
  bio: string | null;
  goals: string | null;
  created_at: string;
  updated_at: string;
};

export type TrainerClient = {
  id: string;
  trainer_id: string;
  client_id: string;
  status: RelationshipStatus;
  created_at: string;
};

export type Availability = {
  id: string;
  trainer_id: string;
  weekday: number;
  start_time: string;
  end_time: string;
  created_at: string;
};

export type Session = {
  id: string;
  trainer_id: string;
  client_id: string | null;
  title: string;
  starts_at: string;
  ends_at: string;
  status: SessionStatus;
  location: string | null;
  notes: string | null;
  created_by: string;
  created_at: string;
};

export type Message = {
  id: string;
  sender_id: string;
  recipient_id: string;
  body: string;
  read_at: string | null;
  created_at: string;
};

export type Announcement = {
  id: string;
  author_id: string;
  title: string;
  body: string;
  created_at: string;
};

export type ClientProgress = {
  id: string;
  client_id: string;
  recorded_by: string;
  recorded_at: string;
  weight_kg: number | null;
  body_fat_pct: number | null;
  notes: string | null;
  metrics: Record<string, unknown>;
  created_at: string;
};

type Row<T> = T;
type Insert<T> = Partial<T>;
type Update<T> = Partial<T>;

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: Row<Profile>;
        Insert: Insert<Profile>;
        Update: Update<Profile>;
      };
      trainer_clients: {
        Row: Row<TrainerClient>;
        Insert: Insert<TrainerClient>;
        Update: Update<TrainerClient>;
      };
      availability: {
        Row: Row<Availability>;
        Insert: Insert<Availability>;
        Update: Update<Availability>;
      };
      sessions: {
        Row: Row<Session>;
        Insert: Insert<Session>;
        Update: Update<Session>;
      };
      messages: {
        Row: Row<Message>;
        Insert: Insert<Message>;
        Update: Update<Message>;
      };
      announcements: {
        Row: Row<Announcement>;
        Insert: Insert<Announcement>;
        Update: Update<Announcement>;
      };
      client_progress: {
        Row: Row<ClientProgress>;
        Insert: Insert<ClientProgress>;
        Update: Update<ClientProgress>;
      };
    };
    Views: Record<string, never>;
    Functions: {
      current_user_role: {
        Args: Record<string, never>;
        Returns: UserRole;
      };
    };
    Enums: {
      user_role: UserRole;
      session_status: SessionStatus;
      relationship_status: RelationshipStatus;
    };
  };
}
