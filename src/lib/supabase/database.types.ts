export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  public: {
    Tables: {
      band_instruments: {
        Row: {
          band_id: string
          created_at: string
          id: string
          is_active: boolean
          name: string
          normalized_name: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          band_id: string
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
          normalized_name: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          band_id?: string
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          normalized_name?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'band_instruments_band_id_fkey'
            columns: ['band_id']
            isOneToOne: false
            referencedRelation: 'bands'
            referencedColumns: ['id']
          },
        ]
      }
      band_invites: {
        Row: {
          band_id: string
          created_at: string
          created_by: string
          expires_at: string | null
          id: string
          is_active: boolean
          last_used_at: string | null
          max_uses: number | null
          revoked_at: string | null
          role: string
          token: string | null
          token_hash: string
          updated_at: string
          use_count: number
        }
        Insert: {
          band_id: string
          created_at?: string
          created_by: string
          expires_at?: string | null
          id?: string
          is_active?: boolean
          last_used_at?: string | null
          max_uses?: number | null
          revoked_at?: string | null
          role?: string
          token?: string | null
          token_hash: string
          updated_at?: string
          use_count?: number
        }
        Update: {
          band_id?: string
          created_at?: string
          created_by?: string
          expires_at?: string | null
          id?: string
          is_active?: boolean
          last_used_at?: string | null
          max_uses?: number | null
          revoked_at?: string | null
          role?: string
          token?: string | null
          token_hash?: string
          updated_at?: string
          use_count?: number
        }
        Relationships: [
          {
            foreignKeyName: 'band_invites_band_id_fkey'
            columns: ['band_id']
            isOneToOne: false
            referencedRelation: 'bands'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'band_invites_created_by_fkey'
            columns: ['created_by']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
        ]
      }
      band_members: {
        Row: {
          band_id: string
          created_at: string
          id: string
          instrument: string | null
          is_active: boolean
          joined_at: string
          left_at: string | null
          role: string
          updated_at: string
          user_id: string
        }
        Insert: {
          band_id: string
          created_at?: string
          id?: string
          instrument?: string | null
          is_active?: boolean
          joined_at?: string
          left_at?: string | null
          role: string
          updated_at?: string
          user_id: string
        }
        Update: {
          band_id?: string
          created_at?: string
          id?: string
          instrument?: string | null
          is_active?: boolean
          joined_at?: string
          left_at?: string | null
          role?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'band_members_band_id_fkey'
            columns: ['band_id']
            isOneToOne: false
            referencedRelation: 'bands'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'band_members_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
        ]
      }
      bands: {
        Row: {
          created_at: string
          created_by: string
          description: string | null
          id: string
          is_archived: boolean
          name: string
          show_member_responses: boolean
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by: string
          description?: string | null
          id?: string
          is_archived?: boolean
          name: string
          show_member_responses?: boolean
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          description?: string | null
          id?: string
          is_archived?: boolean
          name?: string
          show_member_responses?: boolean
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'bands_created_by_fkey'
            columns: ['created_by']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
        ]
      }
      performance_messages: {
        Row: {
          author_name: string
          band_id: string
          body: string
          created_at: string
          id: string
          performance_id: string
          user_id: string
        }
        Insert: {
          author_name: string
          band_id: string
          body: string
          created_at?: string
          id?: string
          performance_id: string
          user_id: string
        }
        Update: {
          author_name?: string
          band_id?: string
          body?: string
          created_at?: string
          id?: string
          performance_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'performance_messages_band_id_fkey'
            columns: ['band_id']
            isOneToOne: false
            referencedRelation: 'bands'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'performance_messages_performance_id_fkey'
            columns: ['performance_id']
            isOneToOne: false
            referencedRelation: 'performances'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'performance_messages_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
        ]
      }
      performance_responses: {
        Row: {
          band_id: string
          created_at: string
          id: string
          performance_id: string
          reason: string | null
          responded_at: string
          response: string
          updated_at: string
          user_id: string
        }
        Insert: {
          band_id: string
          created_at?: string
          id?: string
          performance_id: string
          reason?: string | null
          responded_at?: string
          response: string
          updated_at?: string
          user_id: string
        }
        Update: {
          band_id?: string
          created_at?: string
          id?: string
          performance_id?: string
          reason?: string | null
          responded_at?: string
          response?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'performance_responses_band_id_fkey'
            columns: ['band_id']
            isOneToOne: false
            referencedRelation: 'bands'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'performance_responses_performance_id_fkey'
            columns: ['performance_id']
            isOneToOne: false
            referencedRelation: 'performances'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'performance_responses_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
        ]
      }
      performances: {
        Row: {
          archived_at: string | null
          band_id: string
          cancelled_at: string | null
          created_at: string
          created_by: string
          description: string | null
          end_time: string | null
          gather_time: string | null
          id: string
          location: string
          map_url: string | null
          performance_date: string
          response_deadline: string | null
          start_time: string
          status: string
          title: string
          updated_at: string
          updated_by: string
        }
        Insert: {
          archived_at?: string | null
          band_id: string
          cancelled_at?: string | null
          created_at?: string
          created_by: string
          description?: string | null
          end_time?: string | null
          gather_time?: string | null
          id?: string
          location: string
          map_url?: string | null
          performance_date: string
          response_deadline?: string | null
          start_time: string
          status?: string
          title: string
          updated_at?: string
          updated_by: string
        }
        Update: {
          archived_at?: string | null
          band_id?: string
          cancelled_at?: string | null
          created_at?: string
          created_by?: string
          description?: string | null
          end_time?: string | null
          gather_time?: string | null
          id?: string
          location?: string
          map_url?: string | null
          performance_date?: string
          response_deadline?: string | null
          start_time?: string
          status?: string
          title?: string
          updated_at?: string
          updated_by?: string
        }
        Relationships: [
          {
            foreignKeyName: 'performances_band_id_fkey'
            columns: ['band_id']
            isOneToOne: false
            referencedRelation: 'bands'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'performances_created_by_fkey'
            columns: ['created_by']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'performances_updated_by_fkey'
            columns: ['updated_by']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          display_name: string | null
          email: string
          id: string
          is_superadmin: boolean
          updated_at: string
        }
        Insert: {
          created_at?: string
          display_name?: string | null
          email: string
          id: string
          is_superadmin?: boolean
          updated_at?: string
        }
        Update: {
          created_at?: string
          display_name?: string | null
          email?: string
          id?: string
          is_superadmin?: boolean
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      accept_band_invite: { Args: { p_token: string }; Returns: Json }
      auth_user_id: { Args: Record<PropertyKey, never>; Returns: string }
      can_view_member_responses: { Args: { p_band_id: string }; Returns: boolean }
      create_band: { Args: { p_description?: string; p_name: string }; Returns: string }
      create_band_instrument: {
        Args: { p_band_id: string; p_name: string }
        Returns: {
          band_id: string
          created_at: string
          id: string
          is_active: boolean
          name: string
          normalized_name: string
          sort_order: number
          updated_at: string
        }
        SetofOptions: {
          from: '*'
          to: 'band_instruments'
          isOneToOne: true
          isSetofReturn: false
        }
      }
      create_band_invite: {
        Args: { p_band_id: string; p_expires_at?: string; p_max_uses?: number; p_role?: string }
        Returns: Json
      }
      deactivate_band_instrument: {
        Args: { p_instrument_id: string }
        Returns: {
          band_id: string
          created_at: string
          id: string
          is_active: boolean
          name: string
          normalized_name: string
          sort_order: number
          updated_at: string
        }
        SetofOptions: {
          from: '*'
          to: 'band_instruments'
          isOneToOne: true
          isSetofReturn: false
        }
      }
      deactivate_band_member: {
        Args: { p_band_id: string; p_user_id: string }
        Returns: {
          band_id: string
          created_at: string
          id: string
          instrument: string | null
          is_active: boolean
          joined_at: string
          left_at: string | null
          role: string
          updated_at: string
          user_id: string
        }
        SetofOptions: {
          from: '*'
          to: 'band_members'
          isOneToOne: true
          isSetofReturn: false
        }
      }
      delete_band_member: { Args: { p_band_id: string; p_user_id: string }; Returns: undefined }
      get_all_members: {
        Args: Record<PropertyKey, never>
        Returns: {
          band_id: string
          band_name: string
          display_name: string
          email: string
          instrument: string
          is_active: boolean
          joined_at: string
          left_at: string
          membership_id: string
          role: string
          user_id: string
        }[]
      }
      get_band_instruments: {
        Args: { p_band_id: string; p_include_inactive?: boolean }
        Returns: {
          band_id: string
          created_at: string
          id: string
          is_active: boolean
          name: string
          normalized_name: string
          sort_order: number
          updated_at: string
        }[]
      }
      get_band_invites: {
        Args: { p_band_id: string }
        Returns: {
          band_id: string
          created_at: string
          created_by: string
          expires_at: string
          id: string
          is_active: boolean
          last_used_at: string
          max_uses: number
          revoked_at: string
          role: string
          updated_at: string
          use_count: number
        }[]
      }
      get_band_members: {
        Args: { p_band_id: string }
        Returns: {
          band_id: string
          band_name: string
          display_name: string
          email: string
          instrument: string
          is_active: boolean
          joined_at: string
          left_at: string
          membership_id: string
          role: string
          user_id: string
        }[]
      }
      get_current_band_invite: { Args: { p_band_id: string }; Returns: Json }
      get_join_invite_preview: { Args: { p_token: string }; Returns: Json }
      get_performance_response_overview: { Args: { p_performance_id: string }; Returns: Json }
      has_band_role: { Args: { p_band_id: string; p_roles: string[] }; Returns: boolean }
      is_band_member: { Args: { p_band_id: string }; Returns: boolean }
      is_superadmin: { Args: Record<PropertyKey, never>; Returns: boolean }
      leave_band: { Args: { p_band_id: string }; Returns: undefined }
      normalize_instrument_name: { Args: { p_name: string }; Returns: string }
      reactivate_band_member: {
        Args: { p_band_id: string; p_user_id: string }
        Returns: {
          band_id: string
          created_at: string
          id: string
          instrument: string | null
          is_active: boolean
          joined_at: string
          left_at: string | null
          role: string
          updated_at: string
          user_id: string
        }
        SetofOptions: {
          from: '*'
          to: 'band_members'
          isOneToOne: true
          isSetofReturn: false
        }
      }
      regenerate_band_invite: { Args: { p_band_id: string }; Returns: Json }
      revoke_band_invite: { Args: { p_invite_id: string }; Returns: undefined }
      set_band_member_role: {
        Args: { p_band_id: string; p_role: string; p_user_id: string }
        Returns: {
          band_id: string
          created_at: string
          id: string
          instrument: string | null
          is_active: boolean
          joined_at: string
          left_at: string | null
          role: string
          updated_at: string
          user_id: string
        }
        SetofOptions: {
          from: '*'
          to: 'band_members'
          isOneToOne: true
          isSetofReturn: false
        }
      }
      update_band_instrument: {
        Args: { p_instrument_id: string; p_name: string }
        Returns: {
          band_id: string
          created_at: string
          id: string
          is_active: boolean
          name: string
          normalized_name: string
          sort_order: number
          updated_at: string
        }
        SetofOptions: {
          from: '*'
          to: 'band_instruments'
          isOneToOne: true
          isSetofReturn: false
        }
      }
      update_my_membership_instrument: {
        Args: { p_band_id: string; p_instrument?: string }
        Returns: {
          band_id: string
          created_at: string
          id: string
          instrument: string | null
          is_active: boolean
          joined_at: string
          left_at: string | null
          role: string
          updated_at: string
          user_id: string
        }
        SetofOptions: {
          from: '*'
          to: 'band_members'
          isOneToOne: true
          isSetofReturn: false
        }
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, 'public'>]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    keyof (DefaultSchema['Tables'] & DefaultSchema['Views']) | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
    ? (DefaultSchema['Tables'] & DefaultSchema['Views'])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables'] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables'] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema['Enums'] | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums']
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums'][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema['Enums']
    ? DefaultSchema['Enums'][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    keyof DefaultSchema['CompositeTypes'] | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes']
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes'][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema['CompositeTypes']
    ? DefaultSchema['CompositeTypes'][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
