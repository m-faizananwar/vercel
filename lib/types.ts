import { type Message } from 'ai'

// TODO refactor and remove unneccessary duplicate data.
export interface Chat extends Record<string, any> {
  id: string
  title: string
  createdAt: Date
  userId: string
  path: string
  messages: Message[]
  sharePath?: string // Refactor to use RLS
  teamId?: string
}

export interface Team {
  id: string
  name: string
  description?: string | undefined
  join_code: string
  created_at: string
  updated_at: string
  created_by: string
}

export interface TeamMember {
  id: string
  team_id: string
  user_id: string
  role: 'admin' | 'member'
  joined_at: string
  user?: {
    email?: string
    name?: string
  }
}



export interface TeamWithMembers extends Team {
  members: TeamMember[]
  member_count: number
  user_role?: 'admin' | 'member'
}

export interface SuperAdmin {
  id: string
  user_id: string
  created_at: string
  created_by: string | null
}

export interface UserWithStats {
  user_id: string
  email: string
  created_at: string
  team_count: number
  total_chats: number
  is_super_admin: boolean
}

export interface TeamWithStats {
  team_id: string
  team_name: string
  description: string | null
  join_code: string
  created_at: string
  created_by: string
  creator_email: string
  member_count: number
  admin_count: number
  chat_count: number
}

export type ServerActionResult<Result> = Promise<
  | Result
  | {
      error: string
    }
>
