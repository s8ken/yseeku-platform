import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

describe('Basic Test Setup', () => {
  it('should render a simple component', () => {
    const SimpleComponent = () => <div>Test Component</div>;
    render(<SimpleComponent />);
    
    expect(screen.getByText('Test Component')).toBeInTheDocument();
  });

  it('should work with basic HTML elements', () => {
    render(
      <div>
        <h1>Heading</h1>
        <button>Click me</button>
      </div>
    );
    
    expect(screen.getByRole('heading', { name: 'Heading' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Click me' })).toBeInTheDocument();
  });
});