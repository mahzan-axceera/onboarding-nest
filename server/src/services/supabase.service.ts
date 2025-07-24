import { Injectable } from '@nestjs/common';
import { createClient } from '@supabase/supabase-js';

@Injectable()
export class SupabaseService {
  private readonly supabase;

  constructor() {
    this.supabase = createClient(
      process.env.SUPABASE_URL || 'https://<project-id>.supabase.co',
      process.env.SUPABASE_KEY || '<service_role_key>',
      {
        auth: { persistSession: false },
      },
    );
  }

  getClient() {
    return this.supabase;
  }
}
