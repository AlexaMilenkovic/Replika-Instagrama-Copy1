import { render, screen } from '@testing-library/react';
import App from './App';

test('renders welcome message', () => {
  render(<App />);
  const headingElement = screen.getByText(/Dobrodošli/i);
  expect(headingElement).toBeInTheDocument();
});
