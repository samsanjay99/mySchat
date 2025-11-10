// Super AI Module Exports

// Client Components
export { SuperAIChat } from './client/SuperAIChat';
export { default as AIChatPage } from './client/ai-chat';

// Server Components
export { getSuperAIResponse } from './server/super-ai-service';

// Shared Types
export * from './shared/schema';

// Migration Scripts (for reference)
export const MIGRATION_SCRIPTS = {
  superAI: './server/migrate-super-ai.ts',
  addSuperAIColumn: './server/migrate-add-super-ai-column.ts'
}; 