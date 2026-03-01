import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Login from './Login';

test('proverava da li Login stranica sadrži polja za kredencijale', () => {
  render(
    <BrowserRouter>
      <Login />
    </BrowserRouter>
  );
  
  // Provera za kredenacijale (zahtev 1.1.1)
  expect(screen.getByPlaceholderText(/Korisničko ime ili email/i)).toBeInTheDocument();
  expect(screen.getByPlaceholderText(/Lozinka/i)).toBeInTheDocument();
});