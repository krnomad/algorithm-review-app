// src/lib/supabase.js
import { createClient } from '@supabase/supabase-js';

// CRA는 process.env + REACT_APP_ 접두사만 허용
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Supabase 환경변수가 누락되었습니다. .env 파일에 REACT_APP_SUPABASE_URL 및 REACT_APP_SUPABASE_ANON_KEY 항목이 필요합니다.");
}

export const supabase = createClient(supabaseUrl, supabaseKey);