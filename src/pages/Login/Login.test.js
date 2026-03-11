import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Login from './Login';

// da li dugme stvarno preusmerava
const mockedNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockedNavigate,
}));

describe('Login Komponenta', () => {

  test('proverava da li Login stranica sadrži polja za kredencijale i dugme', () => {
    render(
      <BrowserRouter>
        <Login />
      </BrowserRouter>
    );
    
    expect(screen.getByPlaceholderText(/Korisničko ime ili email/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Lozinka/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Prijavi se/i })).toBeInTheDocument();
  });

  // Test kucanje i kliktanje 
  test('omogućava unos teksta u polja i klik na dugme za prijavu', () => {
    render(
      <BrowserRouter>
        <Login />
      </BrowserRouter>
    );

    const identifierInput = screen.getByPlaceholderText(/Korisničko ime ili email/i);
    const passwordInput = screen.getByPlaceholderText(/Lozinka/i);
    const submitButton = screen.getByRole('button', { name: /Prijavi se/i });

    // kucanje korisnika u input polja
    fireEvent.change(identifierInput, { target: { value: 'ksenija_dev' } });
    fireEvent.change(passwordInput, { target: { value: 'tajnalozinka123' } });

    expect(identifierInput.value).toBe('ksenija_dev');
    expect(passwordInput.value).toBe('tajnalozinka123');

    fireEvent.click(submitButton);

    expect(mockedNavigate).toHaveBeenCalledWith('/');
  });
});