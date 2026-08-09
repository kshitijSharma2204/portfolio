import { render, screen } from '@testing-library/react';
import App from './App';

test('renders the profile name in the left nav', () => {
  render(<App />);
  const nameElement = screen.getByText(/kshitij sharma/i);
  expect(nameElement).toBeInTheDocument();
});
