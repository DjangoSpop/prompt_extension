# Prompt History v2 API Implementation

## Overview

This implementation provides a complete Prompt History v2 system with:

- **Backend API** (Django REST Framework) - User-bound history with credit-based enhancement
- **Frontend Client** (TypeScript) - Type-safe API client with JWT authentication
- **UI Components** (React/TSX) - History list, filters, and enhancement modal
- **Resilience Features** - Offline queue, retry logic, idempotency

## Features

### Backend (`backend/api/v2/history/`)

#### Models (`models.py`)
- `PromptHistory` model with:
  - User-bound (ForeignKey to User)
  - Original and optimized prompts
  - Intent categories, tags, metadata
  - Credit tracking (model, tokens, credits_spent)
  - Soft delete support
  - Comprehensive indexing

#### API Endpoints (`views.py`)
```
POST   /api/v2/history/                # Create history (user-bound)
GET    /api/v2/history/                # List with filters & pagination
GET    /api/v2/history/{id}/           # Retrieve single item
PATCH  /api/v2/history/{id}/           # Update tags/meta
DELETE /api/v2/history/{id}/           # Soft delete
POST   /api/v2/history/{id}/enhance/   # Enhance with AI
```

#### Enhancement Service (`services.py`)
- Multi-model support (GPT-4o, Claude 3.5, etc.)
- Credit deduction and validation
- Style templates (concise, detailed, creative, technical, balanced)
- Insufficient credits error handling

#### Permissions (`permissions.py`)
- Owner-only access
- Optional staff moderation (via settings)

### Frontend (`frontend/`)

#### API Client (`lib/api/history.ts`)
- Type-safe TypeScript client
- JWT authentication with auto-refresh
- Retry logic with exponential backoff
- Idempotency key support
- Error handling and mapping

#### Token Storage (`utils/tokenStorage.ts`)
- Secure storage using `chrome.storage.local`
- JWT access and refresh token management

#### Offline Queue (`utils/offlineQueue.ts`)
- Queues failed requests
- Retries with exponential backoff (2s, 4s, 8s)
- Max 3 retries per request
- Background processor

#### UI Components (`components/`)

**HistoryList.tsx**
- Paginated history display
- Search by keyword
- Filter by intent_category, source, date range
- Keyboard shortcuts (Ctrl/Cmd+Shift+E)

**HistoryRow.tsx**
- Displays history item with badges
- Actions: Enhance, Copy, Open, Delete
- Enhanced prompt preview

**EnhanceModal.tsx**
- Model selection (GPT-4o Mini, GPT-4o, Claude 3.5)
- Style selection (concise, detailed, creative, technical, balanced)
- Credit cost display
- Insufficient credits handling with upsell modal

## Installation

### Backend

```bash
# Install dependencies
pip install djangorestframework djangorestframework-simplejwt openai anthropic

# Run migrations
python manage.py makemigrations
python manage.py migrate

# Add to Django settings
INSTALLED_APPS += ['rest_framework', 'api.v2.history']

# Configure JWT
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': [
        'rest_framework_simplejwt.authentication.JWTAuthentication',
    ],
}

# Add API keys
OPENAI_API_KEY = 'your-key'
ANTHROPIC_API_KEY = 'your-key'
```

### Frontend

```bash
# Install dependencies
npm install

# Build extension
npm run build

# Set environment variable
NEXT_PUBLIC_API_URL=https://your-api.com
```

## Usage

### Creating History

```typescript
import { HistoryApiClient } from './lib/api/history';
import { tokenStorage } from './utils/tokenStorage';

const client = new HistoryApiClient(tokenStorage);

// Create a history entry
const history = await client.create({
  original_prompt: 'Summarize the meeting notes...',
  source: 'extension',
  intent_category: 'summary',
  tags: ['work', 'meeting'],
  meta: { session_id: 'abc123' }
});
```

### Listing History

```typescript
// List with filters
const response = await client.list({
  intent_category: 'summary',
  source: 'extension',
  date_from: '2025-01-01',
  q: 'meeting',
  page: 1,
  page_size: 20
});

console.log(response.results); // Array of PromptHistory
console.log(response.count);   // Total count
```

### Enhancing Prompts

```typescript
// Enhance a prompt
try {
  const enhanced = await client.enhance(historyId, {
    model: 'gpt-4o-mini',
    style: 'concise'
  });

  console.log(enhanced.optimized_prompt);
  console.log(enhanced.credits_spent);
} catch (err) {
  if (err instanceof InsufficientCreditsError) {
    // Show upsell modal
    console.log(`Need ${err.requiredCredits} credits`);
  }
}
```

### Using Components

```tsx
import { HistoryList } from './components/HistoryList';
import { HistoryApiClient } from './lib/api/history';
import { tokenStorage } from './utils/tokenStorage';

function HistoryPanel() {
  const client = new HistoryApiClient(tokenStorage);

  return <HistoryList client={client} />;
}
```

## Testing

### Backend Tests

```bash
python manage.py test api.v2.history
```

### Frontend Tests

```bash
npm test
```

### Manual API Testing

```bash
# Set variables
export JWT="your-jwt-token"
export API="http://localhost:8000"

# Create history
curl -H "Authorization: Bearer $JWT" \
  -H "Content-Type: application/json" \
  -d '{"original_prompt":"Test prompt","source":"extension"}' \
  $API/api/v2/history/

# List history
curl -H "Authorization: Bearer $JWT" \
  "$API/api/v2/history/?source=extension"

# Enhance
curl -X POST -H "Authorization: Bearer $JWT" \
  -H "Content-Type: application/json" \
  -d '{"model":"gpt-4o-mini","style":"concise"}' \
  $API/api/v2/history/{id}/enhance/
```

## Security

- ✅ JWT authentication required
- ✅ User-scoped queries (can't access other users' data)
- ✅ CORS configured for trusted origins
- ✅ Idempotency keys prevent duplicate operations
- ✅ Secure token storage in extension
- ✅ Input validation and sanitization

## Performance

- ✅ Database indexing on common queries
- ✅ Pagination support (default 20 items)
- ✅ Redis caching ready (optional)
- ✅ Efficient query filters
- ✅ Background processing for queue

## Monitoring

The system emits telemetry events:

- `history.create` - History entry created
- `history.enhance.start` - Enhancement started
- `history.enhance.success` - Enhancement completed
- `history.enhance.error` - Enhancement failed

## Architecture

```
┌─────────────────────────────────────────────────────┐
│                Browser Extension                     │
│  ┌──────────────┐  ┌──────────────┐  ┌───────────┐ │
│  │ HistoryList  │  │ EnhanceModal │  │ TokenAuth │ │
│  └──────┬───────┘  └──────┬───────┘  └─────┬─────┘ │
│         │                 │                 │        │
│         └─────────────────┴─────────────────┘        │
│                       │                              │
│              ┌────────▼────────┐                     │
│              │ HistoryApiClient│                     │
│              │  - JWT Auth     │                     │
│              │  - Retry Logic  │                     │
│              │  - Idempotency  │                     │
│              └────────┬────────┘                     │
│                       │                              │
└───────────────────────┼──────────────────────────────┘
                        │
                        │ HTTPS + JWT
                        │
┌───────────────────────▼──────────────────────────────┐
│                Django Backend API                     │
│  ┌──────────────────────────────────────────────┐   │
│  │           PromptHistoryViewSet               │   │
│  │  - create()  - list()  - retrieve()          │   │
│  │  - update()  - destroy()  - enhance()        │   │
│  └─────────────────┬────────────────────────────┘   │
│                    │                                  │
│         ┌──────────┴───────────┐                     │
│         │                      │                      │
│  ┌──────▼──────┐      ┌───────▼──────────┐          │
│  │   Models    │      │ Enhancement      │          │
│  │ PromptHistory│     │ Service          │          │
│  │ - User FK   │      │ - AI APIs        │          │
│  │ - Soft Del  │      │ - Credit Deduct  │          │
│  └─────────────┘      └──────────────────┘          │
│                                                       │
└───────────────────────────────────────────────────────┘
```

## Roadmap

- [ ] Batch operations for bulk updates
- [ ] Export history to CSV/JSON
- [ ] Webhook notifications on enhance complete
- [ ] Real-time collaboration features
- [ ] Advanced analytics dashboard
- [ ] A/B testing for enhancement styles

## Support

For issues or questions:
- Backend: Check Django logs and database queries
- Frontend: Check browser console and network tab
- API: Use curl commands for debugging

## License

MIT License - See LICENSE file for details
