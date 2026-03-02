import { render, screen } from '@testing-library/react';
import App from './App';

test('renderuje početnu poruku', () => {
  render(<App />);
  const element = screen.getByText(/dobrodošli/i);
  expect(element).toBeInTheDocument();
});
