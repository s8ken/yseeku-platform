# Component Documentation

## Overview

This document provides comprehensive documentation for all custom components in the yseeku-platform frontend application.

## Table of Contents

1. [UI Components](#ui-components)
2. [Feature Components](#feature-components)
3. [Chat Components](#chat-components)
4. [Trust Receipt Components](#trust-receipt-components)
5. [Agent Components](#agent-components)
6. [Tutorial Components](#tutorial-components)

---

## UI Components

### Button

**Location:** `src/components/ui/button.tsx`

**Description:** Reusable button component with multiple variants and sizes.

**Props:**
```typescript
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link'
  size?: 'default' | 'sm' | 'lg' | 'icon'
}
```

**Variants:**
- `default` - Primary action button (cyan gradient)
- `destructive` - Danger actions (red)
- `outline` - Secondary actions with border
- `secondary` - Tertiary actions (gray)
- `ghost` - Minimal styling
- `link` - Link-style button

**Sizes:**
- `default` - Standard size (h-10 px-4 py-2)
- `sm` - Small (h-9 px-3)
- `lg` - Large (h-11 px-8)
- `icon` - Icon only (h-10 w-10)

**Usage Example:**
```tsx
import { Button } from '@/components/ui/button';

<Button variant="default" size="lg" onClick={handleClick}>
  Click Me
</Button>
```

---

### Card

**Location:** `src/components/ui/card.tsx`

**Description:** Card component for grouping related content.

**Sub-components:**
- `CardHeader` - Card header section
- `CardTitle` - Card title
- `CardDescription` - Card description
- `CardContent` - Card content area
- `CardFooter` - Card footer section

**Usage Example:**
```tsx
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

<Card>
  <CardHeader>
    <CardTitle>Card Title</CardTitle>
    <CardDescription>Card description goes here</CardDescription>
  </CardHeader>
  <CardContent>
    <p>Card content goes here</p>
  </CardContent>
</Card>
```

---

### Input

**Location:** `src/components/ui/input.tsx`

**Description:** Text input component with consistent styling.

**Props:**
```typescript
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}
```

**Usage Example:**
```tsx
import { Input } from '@/components/ui/input';

<Input
  type="text"
  placeholder="Enter text..."
  value={value}
  onChange={(e) => setValue(e.target.value)}
/>
```

---

### Textarea

**Location:** `src/components/ui/textarea.tsx`

**Description:** Multi-line text input component.

**Props:**
```typescript
interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}
```

**Usage Example:**
```tsx
import { Textarea } from '@/components/ui/textarea';

<Textarea
  placeholder="Enter multi-line text..."
  value={value}
  onChange={(e) => setValue(e.target.value)}
  rows={4}
/>
```

---

### Select

**Location:** `src/components/ui/select.tsx`

**Description:** Dropdown select component.

**Sub-components:**
- `SelectTrigger` - Trigger button
- `SelectValue` - Display value
- `SelectContent` - Dropdown content
- `SelectItem` - Individual option

**Usage Example:**
```tsx
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

<Select value={value} onValueChange={setValue}>
  <SelectTrigger>
    <SelectValue placeholder="Select an option" />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="option1">Option 1</SelectItem>
    <SelectItem value="option2">Option 2</SelectItem>
  </SelectContent>
</Select>
```

---

### Badge

**Location:** `src/components/ui/badge.tsx`

**Description:** Badge component for displaying status and labels.

**Props:**
```typescript
interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'secondary' | 'destructive' | 'outline'
}
```

**Variants:**
- `default` - Primary badge (cyan)
- `secondary` - Secondary badge (gray)
- `destructive` - Danger badge (red)
- `outline` - Outline badge

**Usage Example:**
```tsx
import { Badge } from '@/components/ui/badge';

<Badge variant="default">Active</Badge>
<Badge variant="destructive">Critical</Badge>
<Badge variant="outline">Pending</Badge>
```

---

### Dialog

**Location:** `src/components/ui/dialog.tsx`

**Description:** Modal dialog component.

**Sub-components:**
- `Dialog` - Dialog wrapper
- `DialogTrigger` - Trigger element
- `DialogContent` - Dialog content
- `DialogHeader` - Dialog header
- `DialogTitle` - Dialog title
- `DialogDescription` - Dialog description
- `DialogFooter` - Dialog footer

**Usage Example:**
```tsx
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

<Dialog open={isOpen} onOpenChange={setIsOpen}>
  <DialogTrigger asChild>
    <Button>Open Dialog</Button>
  </DialogTrigger>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Dialog Title</DialogTitle>
      <DialogDescription>Dialog description</DialogDescription>
    </DialogHeader>
    <p>Dialog content</p>
    <DialogFooter>
      <Button onClick={() => setIsOpen(false)}>Close</Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

---

### Tabs

**Location:** `src/components/ui/tabs.tsx`

**Description:** Tabs component for organizing content.

**Sub-components:**
- `Tabs` - Tabs wrapper
- `TabsList` - Tab navigation
- `TabsTrigger` - Tab trigger button
- `TabsContent` - Tab content panel

**Usage Example:**
```tsx
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

<Tabs defaultValue="tab1">
  <TabsList>
    <TabsTrigger value="tab1">Tab 1</TabsTrigger>
    <TabsTrigger value="tab2">Tab 2</TabsTrigger>
  </TabsList>
  <TabsContent value="tab1">Tab 1 content</TabsContent>
  <TabsContent value="tab2">Tab 2 content</TabsContent>
</Tabs>
```

---

### Progress

**Location:** `src/components/ui/progress.tsx`

**Description:** Progress bar component.

**Props:**
```typescript
interface ProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  value?: number
  max?: number
}
```

**Usage Example:**
```tsx
import { Progress } from '@/components/ui/progress';

<Progress value={75} max={100} />
```

---

### Tooltip

**Location:** `src/components/ui/tooltip.tsx`

**Description:** Tooltip component for displaying additional information.

**Sub-components:**
- `Tooltip` - Tooltip wrapper
- `TooltipProvider` - Tooltip context provider
- `TooltipTrigger` - Trigger element
- `TooltipContent` - Tooltip content

**Usage Example:**
```tsx
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

<TooltipProvider>
  <Tooltip>
    <TooltipTrigger asChild>
      <Button>Hover me</Button>
    </TooltipTrigger>
    <TooltipContent>
      <p>Tooltip content</p>
    </TooltipContent>
  </Tooltip>
</TooltipProvider>
```

---

### Info Tooltip

**Location:** `src/components/ui/info-tooltip.tsx`

**Description:** Specialized tooltip for glossary terms and explanations.

**Props:**
```typescript
interface InfoTooltipProps {
  term: string
  definition?: string
}
```

**Usage Example:**
```tsx
import { InfoTooltip } from '@/components/ui/info-tooltip';

<div>
  Bedau Index <InfoTooltip term="Bedau Index" />
</div>
```

---

## Feature Components

### Constitutional Principles

**Location:** `src/components/ConstitutionalPrinciples.tsx`

**Description:** Display component for the 6 SYMBI constitutional principles.

**Props:**
```typescript
interface ConstitutionalPrinciplesProps {
  compact?: boolean
}
```

**Features:**
- Displays all 6 principles with descriptions
- Interactive hover effects
- Compact mode for smaller displays
- Links to glossary

**Usage Example:**
```tsx
import { ConstitutionalPrinciples } from '@/components/ConstitutionalPrinciples';

<ConstitutionalPrinciples compact={false} />
```

---

### Resonance Explorer

**Location:** `src/components/ResonanceExplorer.tsx`

**Description:** 3D visualization component for resonance patterns using Three.js.

**Props:**
```typescript
interface ResonanceExplorerProps {
  resonanceData: ResonanceData
  interactive?: boolean
}
```

**Features:**
- 3D sphere visualization
- Interactive rotation and zoom
- Color-coded resonance levels
- Animation effects

**Usage Example:**
```tsx
import { ResonanceExplorer } from '@/components/ResonanceExplorer';

<ResonanceExplorer
  resonanceData={resonanceData}
  interactive={true}
/>
```

---

### Onboarding Button

**Location:** `src/components/OnboardingButton.tsx`

**Description:** Button component for starting onboarding/tutorial flow.

**Features:**
- Animated design
- Click to start tutorial
- Persistent state

**Usage Example:**
```tsx
import { OnboardingButton } from '@/components/OnboardingButton';

<OnboardingButton />
```

---

## Chat Components

### ChatContainer

**Location:** `src/components/chat/ChatContainer.tsx`

**Description:** Main chat interface component with message history and input.

**Props:**
```typescript
interface ChatContainerProps {
  conversationId?: string
  agentId?: string
  readOnly?: boolean
}
```

**Features:**
- Message display with timestamps
- Real-time message updates
- Typing indicators
- Message input with send button
- Auto-scroll to latest message
- Message threading support (basic)
- Trust receipt generation

**Usage Example:**
```tsx
import { ChatContainer } from '@/components/chat/ChatContainer';

<ChatContainer
  conversationId="conv-123"
  agentId="agent-456"
  readOnly={false}
/>
```

---

### ChatMessage

**Location:** `src/components/chat/ChatMessage.tsx`

**Description:** Individual message component with rich display.

**Props:**
```typescript
interface ChatMessageProps {
  message: {
    id: string
    role: 'user' | 'assistant'
    content: string
    timestamp: string
    trustReceipt?: TrustReceipt
  }
  isOwnMessage?: boolean
}
```

**Features:**
- Message role styling (user/assistant)
- Timestamp display
- Trust receipt attachment
- Copy to clipboard
- Message reactions (basic)
- Markdown rendering support

**Usage Example:**
```tsx
import { ChatMessage } from '@/components/chat/ChatMessage';

<ChatMessage
  message={message}
  isOwnMessage={message.role === 'user'}
/>
```

---

## Trust Receipt Components

### Trust Receipt Card

**Location:** `src/components/trust-receipt/TrustReceiptCard.tsx`

**Description:** Full-size trust receipt display component.

**Props:**
```typescript
interface TrustReceiptCardProps {
  receipt: TrustReceipt
  showDetails?: boolean
  onExpand?: () => void
}
```

**Features:**
- Complete receipt information
- SYMBI scores visualization
- Dimension breakdown
- Hash verification
- Signature display
- Download/export functionality
- Expandable details

**Usage Example:**
```tsx
import { TrustReceiptCard } from '@/components/trust-receipt/TrustReceiptCard';

<TrustReceiptCard
  receipt={receipt}
  showDetails={true}
  onExpand={() => console.log('Expanded')}
/>
```

---

### Trust Receipt Compact

**Location:** `src/components/trust-receipt/TrustReceiptCompact.tsx`

**Description:** Compact trust receipt display for lists and cards.

**Props:**
```typescript
interface TrustReceiptCompactProps {
  receipt: TrustReceipt
  onClick?: () => void
}
```

**Features:**
- Minimalistic display
- Key metrics only
- Click to expand
- Status indicators
- Hash preview

**Usage Example:**
```tsx
import { TrustReceiptCompact } from '@/components/trust-receipt/TrustReceiptCompact';

<TrustReceiptCompact
  receipt={receipt}
  onClick={() => console.log('Clicked')}
/>
```

---

### Explainable Receipt Card

**Location:** `src/components/ExplainableReceiptCard.tsx`

**Description:** Advanced trust receipt with explainable AI features.

**Props:**
```typescript
interface ExplainableReceiptCardProps {
  receipt: TrustReceipt
  explanationLevel?: 'basic' | 'detailed' | 'technical'
}
```

**Features:**
- Multiple explanation levels
- Dimension-specific explanations
- Trend indicators
- Confidence intervals
- Actionable insights

**Usage Example:**
```tsx
import { ExplainableReceiptCard } from '@/components/ExplainableReceiptCard';

<ExplainableReceiptCard
  receipt={receipt}
  explanationLevel="detailed"
/>
```

---

## Agent Components

### Agent Create Modal

**Location:** `src/components/agents/AgentCreateModal.tsx`

**Description:** Modal component for creating new agents.

**Props:**
```typescript
interface AgentCreateModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}
```

**Features:**
- Agent name input
- Model selection
- Configuration options
- Trust protocol settings
- Validation
- DID generation preview

**Usage Example:**
```tsx
import { AgentCreateModal } from '@/components/agents/AgentCreateModal';

<AgentCreateModal
  isOpen={isCreateModalOpen}
  onClose={() => setIsCreateModalOpen(false)}
  onSuccess={() => console.log('Agent created')}
/>
```

---

### Agent Edit Modal

**Location:** `src/components/agents/AgentEditModal.tsx`

**Description:** Modal component for editing existing agents.

**Props:**
```typescript
interface AgentEditModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  agent: Agent
}
```

**Features:**
- Edit agent details
- Update configuration
- Modify trust settings
- Ban/unban agent
- Validation
- Change tracking

**Usage Example:**
```tsx
import { AgentEditModal } from '@/components/agents/AgentEditModal';

<AgentEditModal
  isOpen={isEditModalOpen}
  onClose={() => setIsEditModalOpen(false)}
  onSuccess={() => console.log('Agent updated')}
  agent={agent}
/>
```

---

## Tutorial Components

### Tutorial Tour

**Location:** `src/components/tutorial/TutorialTour.tsx`

**Description:** Interactive tutorial component with step-by-step guidance.

**Props:**
```typescript
interface TutorialTourProps {
  steps: TutorialStep[]
  onComplete?: () => void
  onSkip?: () => void
}
```

**Features:**
- Step-by-step guidance
- Highlight elements
- Skip option
- Progress indicator
- Remember progress
- Customizable steps

**Usage Example:**
```tsx
import { TutorialTour } from '@/components/tutorial/TutorialTour';

<TutorialTour
  steps={tutorialSteps}
  onComplete={() => console.log('Tutorial completed')}
  onSkip={() => console.log('Tutorial skipped')}
/>
```

---

### Tutorial Steps

**Location:** `src/components/tutorial/steps.ts`

**Description:** Pre-defined tutorial steps for platform onboarding.

**Included Steps:**
1. Dashboard Overview
2. Agent Management
3. Trust Receipts
4. Monitoring
5. Orchestration
6. Settings

**Usage:**
```typescript
import { getTutorialSteps } from '@/components/tutorial/steps';

const steps = getTutorialSteps('onboarding');
```

---

## Component Best Practices

### 1. TypeScript

Always use TypeScript interfaces for props:

```tsx
interface MyComponentProps {
  title: string
  count?: number
  onClick?: () => void
}

export function MyComponent({ title, count = 0, onClick }: MyComponentProps) {
  return <div>{title}: {count}</div>;
}
```

### 2. Error Boundaries

Wrap components that might fail:

```tsx
import { ErrorBoundary } from 'react-error-boundary';

<ErrorBoundary fallback={<div>Something went wrong</div>}>
  <MyComponent />
</ErrorBoundary>
```

### 3. Loading States

Always show loading states:

```tsx
if (isLoading) {
  return <div>Loading...</div>;
}
```

### 4. Empty States

Handle empty data gracefully:

```tsx
if (!data || data.length === 0) {
  return <EmptyState message="No data available" />;
}
```

### 5. Accessibility

Use ARIA labels and roles:

```tsx
<button
  aria-label="Close modal"
  role="button"
  onClick={onClose}
>
  <XIcon />
</button>
```

### 6. Responsive Design

Use responsive classes:

```tsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
```

### 7. Performance

Use `useCallback` and `useMemo`:

```tsx
const handleClick = useCallback(() => {
  onClick(id);
}, [onClick, id]);

const expensiveValue = useMemo(() => {
  return heavyCalculation(data);
}, [data]);
```

---

## Component Library Customization

### Adding New Components

1. Create component file in `src/components/ui/`
2. Export from index if needed
3. Add to this documentation
4. Add tests if applicable

### Modifying Existing Components

1. Follow existing patterns
2. Maintain backward compatibility
3. Update documentation
4. Update tests

---

**Last Updated:** January 17, 2025  
**Version:** 1.4.0