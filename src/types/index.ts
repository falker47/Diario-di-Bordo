export type Section = "quotidiani" | "speciali" | "equipe";

export const SECTIONS: readonly Section[] = ["quotidiani", "speciali", "equipe"] as const;

export const SECTION_LABELS: Record<Section, string> = {
  quotidiani: "Quotidiani",
  speciali: "Speciali",
  equipe: "Equipe",
};

export type ImageMediaItem = {
  type: "image";
  public_id: string;
  url: string;
  width: number;
  height: number;
};

export type VideoMediaItem = {
  type: "video";
  public_id: string;
  url: string;
  thumbnail: string;
  duration: number;
};

export type MediaItem = ImageMediaItem | VideoMediaItem;

export type Profile = {
  id: string;
  username: string;
  full_name: string;
  is_active: boolean;
  created_at: string;
};

export type Contribution = {
  id: string;
  diary_date: string;
  author_id: string;
  section: Section;
  title: string | null;
  text_content: string | null;
  media: MediaItem[];
  created_at: string;
  updated_at: string;
  last_edited_at: string | null;
};

export type ContributionAuthor = Pick<Profile, "username" | "full_name" | "is_active">;

export type ContributionWithAuthor = Contribution & {
  author: ContributionAuthor | null;
};

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: Profile;
        Insert: Omit<Profile, "created_at" | "is_active"> & {
          created_at?: string;
          is_active?: boolean;
        };
        Update: Partial<Omit<Profile, "id">>;
        Relationships: [];
      };
      contributions: {
        Row: Contribution;
        Insert: Omit<
          Contribution,
          "id" | "created_at" | "updated_at" | "last_edited_at" | "media" | "title"
        > & {
          id?: string;
          created_at?: string;
          updated_at?: string;
          last_edited_at?: string | null;
          media?: MediaItem[];
          title?: string | null;
        };
        Update: Partial<Omit<Contribution, "id" | "created_at" | "author_id">>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
