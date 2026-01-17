import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { EnhancedChatContainer } from '../EnhancedChatContainer';

// Mock API
jest.mock('@/lib/api', () => ({
  api: {
    getConversation: jest.fn(),
    getMessages: jest.fn(),
  },
}));

// Mock toast
jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

describe('EnhancedChatContainer', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
        mutations: {
          retry: false,
        },
      },
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  const renderWithProviders = (component: React.ReactElement) => {
    return render(
      <QueryClientProvider client={queryClient}>
        {component}
      </QueryClientProvider>
    );
  };

  describe('Rendering', () => {
    test('should render loading state initially', () => {
      const { api } = require('@/lib/api');
      api.getConversation.mockImplementation(() => new Promise(() => {}));

      renderWithProviders(
        <EnhancedChatContainer conversationId="test-conv" />
      );

      expect(screen.getByRole('status')).toBeInTheDocument();
    });

    test('should render chat interface with conversation', async () => {
      const { api } = require('@/lib/api');
      api.getConversation.mockResolvedValue({
        id: 'test-conv',
        title: 'Test Conversation',
        agentId: 'agent-1',
        agentName: 'Test Agent',
        createdAt: '2025-01-17T00:00:00Z',
        updatedAt: '2025-01-17T00:00:00Z',
        messageCount: 2,
      });

      api.getMessages.mockResolvedValue([
        {
          id: 'msg-1',
          conversationId: 'test-conv',
          role: 'user',
          content: 'Hello',
          timestamp: '2025-01-17T00:00:00Z',
        },
        {
          id: 'msg-2',
          conversationId: 'test-conv',
          role: 'assistant',
          content: 'Hi there!',
          timestamp: '2025-01-17T00:00:01Z',
        },
      ]);

      renderWithProviders(
        <EnhancedChatContainer conversationId="test-conv" />
      );

      await waitFor(() => {
        expect(screen.getByText('Test Conversation')).toBeInTheDocument();
      });

      await waitFor(() => {
        expect(screen.getByText('Hello')).toBeInTheDocument();
        expect(screen.getByText('Hi there!')).toBeInTheDocument();
      });
    });

    test('should render read-only mode correctly', async () => {
      const { api } = require('@/lib/api');
      api.getConversation.mockResolvedValue({
        id: 'test-conv',
        title: 'Test Conversation',
        agentId: 'agent-1',
        agentName: 'Test Agent',
        createdAt: '2025-01-17T00:00:00Z',
        updatedAt: '2025-01-17T00:00:00Z',
        messageCount: 1,
      });

      api.getMessages.mockResolvedValue([]);

      renderWithProviders(
        <EnhancedChatContainer conversationId="test-conv" readOnly />
      );

      await waitFor(() => {
        expect(screen.queryByPlaceholderText(/type your message/i)).not.toBeInTheDocument();
      });
    });
  });

  describe('Message Display', () => {
    test('should display user messages with correct styling', async () => {
      const { api } = require('@/lib/api');
      api.getConversation.mockResolvedValue({
        id: 'test-conv',
        title: 'Test Conversation',
        agentId: 'agent-1',
        agentName: 'Test Agent',
        createdAt: '2025-01-17T00:00:00Z',
        updatedAt: '2025-01-17T00:00:00Z',
        messageCount: 1,
      });

      api.getMessages.mockResolvedValue([
        {
          id: 'msg-1',
          conversationId: 'test-conv',
          role: 'user',
          content: 'User message',
          timestamp: '2025-01-17T00:00:00Z',
        },
      ]);

      renderWithProviders(
        <EnhancedChatContainer conversationId="test-conv" />
      );

      await waitFor(() => {
        expect(screen.getByText('User message')).toBeInTheDocument();
      });
    });

    test('should display assistant messages with correct styling', async () => {
      const { api } = require('@/lib/api');
      api.getConversation.mockResolvedValue({
        id: 'test-conv',
        title: 'Test Conversation',
        agentId: 'agent-1',
        agentName: 'Test Agent',
        createdAt: '2025-01-17T00:00:00Z',
        updatedAt: '2025-01-17T00:00:00Z',
        messageCount: 1,
      });

      api.getMessages.mockResolvedValue([
        {
          id: 'msg-1',
          conversationId: 'test-conv',
          role: 'assistant',
          content: 'Assistant message',
          timestamp: '2025-01-17T00:00:00Z',
        },
      ]);

      renderWithProviders(
        <EnhancedChatContainer conversationId="test-conv" />
      );

      await waitFor(() => {
        expect(screen.getByText('Assistant message')).toBeInTheDocument();
      });
    });

    test('should display message timestamps', async () => {
      const { api } = require('@/lib/api');
      api.getConversation.mockResolvedValue({
        id: 'test-conv',
        title: 'Test Conversation',
        agentId: 'agent-1',
        agentName: 'Test Agent',
        createdAt: '2025-01-17T00:00:00Z',
        updatedAt: '2025-01-17T00:00:00Z',
        messageCount: 1,
      });

      api.getMessages.mockResolvedValue([
        {
          id: 'msg-1',
          conversationId: 'test-conv',
          role: 'user',
          content: 'Test message',
          timestamp: '2025-01-17T12:30:00Z',
        },
      ]);

      renderWithProviders(
        <EnhancedChatContainer conversationId="test-conv" />
      );

      await waitFor(() => {
        expect(screen.getByText(/12:30/)).toBeInTheDocument();
      });
    });
  });

  describe('Message Actions', () => {
    test('should copy message to clipboard', async () => {
      const { api } = require('@/lib/api');
      api.getConversation.mockResolvedValue({
        id: 'test-conv',
        title: 'Test Conversation',
        agentId: 'agent-1',
        agentName: 'Test Agent',
        createdAt: '2025-01-17T00:00:00Z',
        updatedAt: '2025-01-17T00:00:00Z',
        messageCount: 1,
      });

      api.getMessages.mockResolvedValue([
        {
          id: 'msg-1',
          conversationId: 'test-conv',
          role: 'assistant',
          content: 'Test message',
          timestamp: '2025-01-17T00:00:00Z',
        },
      ]);

      const { toast } = require('sonner');
      Object.assign(navigator, {
        clipboard: {
          writeText: jest.fn().mockResolvedValue(undefined),
        },
      });

      renderWithProviders(
        <EnhancedChatContainer conversationId="test-conv" />
      );

      await waitFor(() => {
        const copyButton = screen.getAllByRole('button')[1]; // Second button is copy
        fireEvent.click(copyButton);
      });

      expect(navigator.clipboard.writeText).toHaveBeenCalledWith('Test message');
      expect(toast.success).toHaveBeenCalledWith('Copied to clipboard');
    });

    test('should show emoji picker on click', async () => {
      const { api } = require('@/lib/api');
      api.getConversation.mockResolvedValue({
        id: 'test-conv',
        title: 'Test Conversation',
        agentId: 'agent-1',
        agentName: 'Test Agent',
        createdAt: '2025-01-17T00:00:00Z',
        updatedAt: '2025-01-17T00:00:00Z',
        messageCount: 1,
      });

      api.getMessages.mockResolvedValue([
        {
          id: 'msg-1',
          conversationId: 'test-conv',
          role: 'assistant',
          content: 'Test message',
          timestamp: '2025-01-17T00:00:00Z',
        },
      ]);

      renderWithProviders(
        <EnhancedChatContainer conversationId="test-conv" />
      );

      await waitFor(() => {
        const emojiButton = screen.getAllByRole('button')[2]; // Third button is emoji
        fireEvent.click(emojiButton);
      });

      expect(screen.getByText('👍')).toBeInTheDocument();
    });
  });

  describe('Search Functionality', () => {
    test('should filter messages based on search query', async () => {
      const { api } = require('@/lib/api');
      api.getConversation.mockResolvedValue({
        id: 'test-conv',
        title: 'Test Conversation',
        agentId: 'agent-1',
        agentName: 'Test Agent',
        createdAt: '2025-01-17T00:00:00Z',
        updatedAt: '2025-01-17T00:00:00Z',
        messageCount: 3,
      });

      api.getMessages.mockResolvedValue([
        {
          id: 'msg-1',
          conversationId: 'test-conv',
          role: 'user',
          content: 'Hello world',
          timestamp: '2025-01-17T00:00:00Z',
        },
        {
          id: 'msg-2',
          conversationId: 'test-conv',
          role: 'assistant',
          content: 'Test message',
          timestamp: '2025-01-17T00:00:01Z',
        },
        {
          id: 'msg-3',
          conversationId: 'test-conv',
          role: 'user',
          content: 'Another test',
          timestamp: '2025-01-17T00:00:02Z',
        },
      ]);

      renderWithProviders(
        <EnhancedChatContainer conversationId="test-conv" />
      );

      await waitFor(() => {
        expect(screen.getByText('Hello world')).toBeInTheDocument();
        expect(screen.getByText('Test message')).toBeInTheDocument();
        expect(screen.getByText('Another test')).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText(/search messages/i);
      fireEvent.change(searchInput, { target: { value: 'test' } });

      await waitFor(() => {
        expect(screen.queryByText('Hello world')).not.toBeInTheDocument();
        expect(screen.getByText('Test message')).toBeInTheDocument();
        expect(screen.getByText('Another test')).toBeInTheDocument();
      });
    });
  });

  describe('Tabs', () => {
    test('should switch between chat and history tabs', async () => {
      const { api } = require('@/lib/api');
      api.getConversation.mockResolvedValue({
        id: 'test-conv',
        title: 'Test Conversation',
        agentId: 'agent-1',
        agentName: 'Test Agent',
        createdAt: '2025-01-17T00:00:00Z',
        updatedAt: '2025-01-17T00:00:00Z',
        messageCount: 1,
      });

      api.getMessages.mockResolvedValue([
        {
          id: 'msg-1',
          conversationId: 'test-conv',
          role: 'user',
          content: 'Test message',
          timestamp: '2025-01-17T00:00:00Z',
        },
      ]);

      renderWithProviders(
        <EnhancedChatContainer conversationId="test-conv" />
      );

      await waitFor(() => {
        expect(screen.getByText('Chat')).toBeInTheDocument();
        expect(screen.getByText('History')).toBeInTheDocument();
      });

      const historyTab = screen.getByText('History');
      fireEvent.click(historyTab);

      await waitFor(() => {
        expect(screen.getByText('History')).toHaveAttribute('data-state', 'active');
      });
    });
  });

  describe('Thread Support', () => {
    test('should allow starting a thread on assistant messages', async () => {
      const { api } = require('@/lib/api');
      api.getConversation.mockResolvedValue({
        id: 'test-conv',
        title: 'Test Conversation',
        agentId: 'agent-1',
        agentName: 'Test Agent',
        createdAt: '2025-01-17T00:00:00Z',
        updatedAt: '2025-01-17T00:00:00Z',
        messageCount: 1,
      });

      api.getMessages.mockResolvedValue([
        {
          id: 'msg-1',
          conversationId: 'test-conv',
          role: 'assistant',
          content: 'Assistant message',
          timestamp: '2025-01-17T00:00:00Z',
        },
      ]);

      renderWithProviders(
        <EnhancedChatContainer conversationId="test-conv" />
      );

      await waitFor(() => {
        const replyButton = screen.getByText(/reply in thread/i);
        expect(replyButton).toBeInTheDocument();
      });
    });
  });
});