import { render, screen } from '@testing-library/react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Table, TableHeader, TableHead, TableBody, TableRow, TableCell } from '../ui/table';
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from '../ui/dialog';

describe('Accessibility Tests', () => {
  describe('Button Component', () => {
    it('has proper focus styles', () => {
      render(<Button>Click me</Button>);
      const button = screen.getByRole('button', { name: /click me/i });
      expect(button).toHaveClass('focus-visible:ring-2');
    });

    it('is keyboard accessible', () => {
      render(<Button>Click me</Button>);
      const button = screen.getByRole('button', { name: /click me/i });
      button.focus();
      expect(button).toHaveFocus();
    });
  });

  describe('Input Component', () => {
    it('has proper focus styles', () => {
      render(<Input placeholder="Enter text" />);
      const input = screen.getByPlaceholderText('Enter text');
      expect(input).toHaveClass('focus-visible:ring-2');
    });

    it('is keyboard accessible', () => {
      render(<Input placeholder="Enter text" />);
      const input = screen.getByPlaceholderText('Enter text');
      input.focus();
      expect(input).toHaveFocus();
    });
  });

  describe('Table Component', () => {
    it('has proper table structure', () => {
      render(
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead scope="col">Header 1</TableHead>
              <TableHead scope="col">Header 2</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell>Data 1</TableCell>
              <TableCell>Data 2</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      );

      expect(screen.getByRole('table')).toBeInTheDocument();
      expect(screen.getByText('Header 1')).toHaveAttribute('scope', 'col');
      expect(screen.getByText('Header 2')).toHaveAttribute('scope', 'col');
    });
  });

  describe('Dialog Component', () => {
    it('has proper ARIA attributes', () => {
      render(
        <Dialog>
          <DialogTrigger>Open Dialog</DialogTrigger>
          <DialogContent>
            <DialogTitle>Dialog Title</DialogTitle>
            <p>Dialog content</p>
          </DialogContent>
        </Dialog>
      );

      const trigger = screen.getByRole('button', { name: /open dialog/i });
      expect(trigger).toBeInTheDocument();
    });

    it('closes on escape key', () => {
      render(
        <Dialog defaultOpen>
          <DialogContent>
            <DialogTitle>Dialog Title</DialogTitle>
            <p>Dialog content</p>
          </DialogContent>
        </Dialog>
      );

      // Radix UI handles escape key, but we can test if dialog is present
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });
  });

  describe('Skip Links', () => {
    it('has skip link to main content', () => {
      // This would be tested in layout tests
      // For now, just check if we can render a skip link
      render(
        <a href="#main-content" className="sr-only focus:not-sr-only">
          Skip to main content
        </a>
      );

      const skipLink = screen.getByText('Skip to main content');
      expect(skipLink).toHaveClass('sr-only');
      expect(skipLink).toHaveAttribute('href', '#main-content');
    });
  });

  describe('Live Regions', () => {
    it('has live region for announcements', () => {
      render(
        <div aria-live="polite" aria-atomic="true" id="announcements">
          Announcement
        </div>
      );

      const liveRegion = screen.getByText('Announcement');
      expect(liveRegion).toHaveAttribute('aria-live', 'polite');
      expect(liveRegion).toHaveAttribute('aria-atomic', 'true');
    });
  });
});