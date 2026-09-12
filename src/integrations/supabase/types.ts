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
      appointments: {
        Row: {
          business_id: string
          client_id: string
          created_at: string
          datetime: string
          id: string
          notes: string | null
          professional_id: string
          service_id: string
          status: Database["public"]["Enums"]["appointment_status"]
          updated_at: string
        }
        Insert: {
          business_id: string
          client_id: string
          created_at?: string
          datetime: string
          id?: string
          notes?: string | null
          professional_id: string
          service_id: string
          status?: Database["public"]["Enums"]["appointment_status"]
          updated_at?: string
        }
        Update: {
          business_id?: string
          client_id?: string
          created_at?: string
          datetime?: string
          id?: string
          notes?: string | null
          professional_id?: string
          service_id?: string
          status?: Database["public"]["Enums"]["appointment_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "appointments_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "professionals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      businesses: {
        Row: {
          address: string | null
          banner_url: string | null
          created_at: string
          description: string | null
          hours: Json | null
          id: string
          logo_url: string | null
          name: string
          onboarding_completed: boolean | null
          owner_id: string
          rating_avg: number | null
          slug: string
          theme_color: string | null
          type: Database["public"]["Enums"]["business_type"]
          updated_at: string
          whatsapp: string | null
        }
        Insert: {
          address?: string | null
          banner_url?: string | null
          created_at?: string
          description?: string | null
          hours?: Json | null
          id?: string
          logo_url?: string | null
          name: string
          onboarding_completed?: boolean | null
          owner_id: string
          rating_avg?: number | null
          slug: string
          theme_color?: string | null
          type?: Database["public"]["Enums"]["business_type"]
          updated_at?: string
          whatsapp?: string | null
        }
        Update: {
          address?: string | null
          banner_url?: string | null
          created_at?: string
          description?: string | null
          hours?: Json | null
          id?: string
          logo_url?: string | null
          name?: string
          onboarding_completed?: boolean | null
          owner_id?: string
          rating_avg?: number | null
          slug?: string
          theme_color?: string | null
          type?: Database["public"]["Enums"]["business_type"]
          updated_at?: string
          whatsapp?: string | null
        }
        Relationships: []
      }
      clients: {
        Row: {
          business_id: string
          created_at: string
          first_visit: string | null
          id: string
          last_visit: string | null
          name: string
          notes: string | null
          phone: string
          total_spent: number | null
          total_visits: number | null
          updated_at: string
        }
        Insert: {
          business_id: string
          created_at?: string
          first_visit?: string | null
          id?: string
          last_visit?: string | null
          name: string
          notes?: string | null
          phone: string
          total_spent?: number | null
          total_visits?: number | null
          updated_at?: string
        }
        Update: {
          business_id?: string
          created_at?: string
          first_visit?: string | null
          id?: string
          last_visit?: string | null
          name?: string
          notes?: string | null
          phone?: string
          total_spent?: number | null
          total_visits?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "clients_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      configuracoes: {
        Row: {
          cor_fundo_qr: string
          cor_qr: string
          created_at: string
          dominio_curto: string
          email_notificacao: string | null
          id: string
          updated_at: string
          whatsapp_notificacao: string | null
        }
        Insert: {
          cor_fundo_qr?: string
          cor_qr?: string
          created_at?: string
          dominio_curto?: string
          email_notificacao?: string | null
          id?: string
          updated_at?: string
          whatsapp_notificacao?: string | null
        }
        Update: {
          cor_fundo_qr?: string
          cor_qr?: string
          created_at?: string
          dominio_curto?: string
          email_notificacao?: string | null
          id?: string
          updated_at?: string
          whatsapp_notificacao?: string | null
        }
        Relationships: []
      }
      estabelecimentos: {
        Row: {
          created_at: string
          endereco: string | null
          id: string
          logo_url: string | null
          nome: string
          plano: Database["public"]["Enums"]["plano_tipo"]
          responsavel: string | null
          status: Database["public"]["Enums"]["estab_status"]
          telefone: string | null
          updated_at: string
          valor_mensalidade: number
          whatsapp: string | null
        }
        Insert: {
          created_at?: string
          endereco?: string | null
          id?: string
          logo_url?: string | null
          nome: string
          plano?: Database["public"]["Enums"]["plano_tipo"]
          responsavel?: string | null
          status?: Database["public"]["Enums"]["estab_status"]
          telefone?: string | null
          updated_at?: string
          valor_mensalidade?: number
          whatsapp?: string | null
        }
        Update: {
          created_at?: string
          endereco?: string | null
          id?: string
          logo_url?: string | null
          nome?: string
          plano?: Database["public"]["Enums"]["plano_tipo"]
          responsavel?: string | null
          status?: Database["public"]["Enums"]["estab_status"]
          telefone?: string | null
          updated_at?: string
          valor_mensalidade?: number
          whatsapp?: string | null
        }
        Relationships: []
      }
      feedbacks_privados: {
        Row: {
          comentario: string | null
          contato_cliente: string | null
          created_at: string
          id: string
          lido: boolean
          nota: number
          placa_id: string
          scan_id: string | null
        }
        Insert: {
          comentario?: string | null
          contato_cliente?: string | null
          created_at?: string
          id?: string
          lido?: boolean
          nota: number
          placa_id: string
          scan_id?: string | null
        }
        Update: {
          comentario?: string | null
          contato_cliente?: string | null
          created_at?: string
          id?: string
          lido?: boolean
          nota?: number
          placa_id?: string
          scan_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "feedbacks_privados_placa_id_fkey"
            columns: ["placa_id"]
            isOneToOne: false
            referencedRelation: "placas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "feedbacks_privados_scan_id_fkey"
            columns: ["scan_id"]
            isOneToOne: false
            referencedRelation: "scans"
            referencedColumns: ["id"]
          },
        ]
      }
      placas: {
        Row: {
          apelido: string | null
          codigo_curto: string
          created_at: string
          data_instalacao: string | null
          data_venda: string | null
          estabelecimento_id: string | null
          id: string
          preco_venda: number
          status: Database["public"]["Enums"]["placa_status"]
          tipo_destino: Database["public"]["Enums"]["tipo_destino"]
          updated_at: string
          url_destino: string | null
          url_feedback_negativo: string | null
          url_google: string | null
        }
        Insert: {
          apelido?: string | null
          codigo_curto: string
          created_at?: string
          data_instalacao?: string | null
          data_venda?: string | null
          estabelecimento_id?: string | null
          id?: string
          preco_venda?: number
          status?: Database["public"]["Enums"]["placa_status"]
          tipo_destino?: Database["public"]["Enums"]["tipo_destino"]
          updated_at?: string
          url_destino?: string | null
          url_feedback_negativo?: string | null
          url_google?: string | null
        }
        Update: {
          apelido?: string | null
          codigo_curto?: string
          created_at?: string
          data_instalacao?: string | null
          data_venda?: string | null
          estabelecimento_id?: string | null
          id?: string
          preco_venda?: number
          status?: Database["public"]["Enums"]["placa_status"]
          tipo_destino?: Database["public"]["Enums"]["tipo_destino"]
          updated_at?: string
          url_destino?: string | null
          url_feedback_negativo?: string | null
          url_google?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "placas_estabelecimento_id_fkey"
            columns: ["estabelecimento_id"]
            isOneToOne: false
            referencedRelation: "estabelecimentos"
            referencedColumns: ["id"]
          },
        ]
      }
      professional_services: {
        Row: {
          id: string
          professional_id: string
          service_id: string
        }
        Insert: {
          id?: string
          professional_id: string
          service_id: string
        }
        Update: {
          id?: string
          professional_id?: string
          service_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "professional_services_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "professionals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "professional_services_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      professionals: {
        Row: {
          active: boolean | null
          booking_slug: string | null
          business_id: string
          created_at: string
          id: string
          name: string
          online_now: boolean | null
          photo_url: string | null
          schedule: Json | null
          specialty: string | null
          updated_at: string
        }
        Insert: {
          active?: boolean | null
          booking_slug?: string | null
          business_id: string
          created_at?: string
          id?: string
          name: string
          online_now?: boolean | null
          photo_url?: string | null
          schedule?: Json | null
          specialty?: string | null
          updated_at?: string
        }
        Update: {
          active?: boolean | null
          booking_slug?: string | null
          business_id?: string
          created_at?: string
          id?: string
          name?: string
          online_now?: boolean | null
          photo_url?: string | null
          schedule?: Json | null
          specialty?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "professionals_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      ratings: {
        Row: {
          appointment_id: string
          business_id: string
          created_at: string
          id: string
          score: number
        }
        Insert: {
          appointment_id: string
          business_id: string
          created_at?: string
          id?: string
          score: number
        }
        Update: {
          appointment_id?: string
          business_id?: string
          created_at?: string
          id?: string
          score?: number
        }
        Relationships: [
          {
            foreignKeyName: "ratings_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ratings_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      scans: {
        Row: {
          avaliacao_estrelas: number | null
          cidade_aproximada: string | null
          id: string
          placa_id: string
          redirecionou_para_google: boolean
          sistema_operacional: string | null
          timestamp: string
          user_agent: string | null
        }
        Insert: {
          avaliacao_estrelas?: number | null
          cidade_aproximada?: string | null
          id?: string
          placa_id: string
          redirecionou_para_google?: boolean
          sistema_operacional?: string | null
          timestamp?: string
          user_agent?: string | null
        }
        Update: {
          avaliacao_estrelas?: number | null
          cidade_aproximada?: string | null
          id?: string
          placa_id?: string
          redirecionou_para_google?: boolean
          sistema_operacional?: string | null
          timestamp?: string
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "scans_placa_id_fkey"
            columns: ["placa_id"]
            isOneToOne: false
            referencedRelation: "placas"
            referencedColumns: ["id"]
          },
        ]
      }
      services: {
        Row: {
          active: boolean | null
          business_id: string
          created_at: string
          duration_minutes: number
          icon_key: string | null
          id: string
          name: string
          price: number
          updated_at: string
        }
        Insert: {
          active?: boolean | null
          business_id: string
          created_at?: string
          duration_minutes?: number
          icon_key?: string | null
          id?: string
          name: string
          price?: number
          updated_at?: string
        }
        Update: {
          active?: boolean | null
          business_id?: string
          created_at?: string
          duration_minutes?: number
          icon_key?: string | null
          id?: string
          name?: string
          price?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "services_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      usuarios_estabelecimento: {
        Row: {
          auth_user_id: string | null
          created_at: string
          email: string
          estabelecimento_id: string
          id: string
        }
        Insert: {
          auth_user_id?: string | null
          created_at?: string
          email: string
          estabelecimento_id: string
          id?: string
        }
        Update: {
          auth_user_id?: string | null
          created_at?: string
          email?: string
          estabelecimento_id?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "usuarios_estabelecimento_estabelecimento_id_fkey"
            columns: ["estabelecimento_id"]
            isOneToOne: false
            referencedRelation: "estabelecimentos"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      gerar_codigo_placa: { Args: never; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_admin: { Args: { _user_id: string }; Returns: boolean }
      meus_estabelecimentos: { Args: { _user_id: string }; Returns: string[] }
      registrar_avaliacao: {
        Args: { _estrelas: number; _foi_google: boolean; _scan_id: string }
        Returns: undefined
      }
      registrar_feedback: {
        Args: {
          _codigo: string
          _comentario: string
          _contato: string
          _nota: number
          _scan_id: string
        }
        Returns: undefined
      }
      registrar_scan: {
        Args: {
          _cidade: string
          _codigo: string
          _so: string
          _user_agent: string
        }
        Returns: string
      }
      reivindicar_admin: { Args: never; Returns: boolean }
      resolver_placa: {
        Args: { _codigo: string }
        Returns: {
          estabelecimento_logo: string
          estabelecimento_nome: string
          placa_id: string
          status: Database["public"]["Enums"]["placa_status"]
          tipo_destino: Database["public"]["Enums"]["tipo_destino"]
          url_destino: string
          url_feedback_negativo: string
          url_google: string
        }[]
      }
    }
    Enums: {
      app_role: "admin" | "estabelecimento"
      appointment_status: "pending" | "confirmed" | "completed" | "cancelled"
      business_type: "salon" | "clinic"
      estab_status: "ativo" | "inadimplente"
      placa_status:
        | "em_estoque"
        | "vendida"
        | "instalada"
        | "ativa"
        | "inativa"
        | "defeito"
      plano_tipo: "avulso" | "mensal"
      tipo_destino: "direto" | "funil_avaliacao"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "estabelecimento"],
      appointment_status: ["pending", "confirmed", "completed", "cancelled"],
      business_type: ["salon", "clinic"],
      estab_status: ["ativo", "inadimplente"],
      placa_status: [
        "em_estoque",
        "vendida",
        "instalada",
        "ativa",
        "inativa",
        "defeito",
      ],
      plano_tipo: ["avulso", "mensal"],
      tipo_destino: ["direto", "funil_avaliacao"],
    },
  },
} as const
