import { render, screen } from '@testing-library/react';
import App from './App';

test('renderuje Instagram Replica naslov', () => {
  render(<App />);
  // Sada test traži naš novi naslov na vrhu ekrana
  const element = screen.getByText(/Instagram Replica/i);
  expect(element).toBeInTheDocument();
});