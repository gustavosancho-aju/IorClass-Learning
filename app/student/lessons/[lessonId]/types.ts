/**
 * Shared types for the Lesson Player and its tab components.
 * Using explicit field declarations + index signature for DB compatibility.
 */
import type { ModuleContent } from '@/lib/content-generator'

export interface LessonModule {
  id:           string
  lesson_id:    string
  type:         string
  title:        string
  content_json: ModuleContent
  order_index:  number
  created_at:   string
  updated_at:   string
}
