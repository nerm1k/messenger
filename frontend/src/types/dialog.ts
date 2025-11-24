import type { UserResponse } from "./auth";

export interface DialogResponse {
  id: number;
  user1_id: number;
  user2_id: number;
  created_at: string;
  updated_at: string;
  other_user: UserResponse;
  last_message?: MessageResponse;
  unread_count: number;
}

export interface MessageResponse {
  id: number;
  sender_id: number;
  dialog_id: number;
  content: string;
  is_read: boolean;
  created_at: string;
  sender: UserResponse;
}