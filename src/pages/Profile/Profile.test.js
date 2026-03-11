import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Profile from './Profile';

const mockedNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockedNavigate,
}));

describe('Profile Komponenta', () => {
  
  test('prikazuje osnovne informacije o korisniku (ime, bio, statistika)', () => {
    render(
      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Profile />
      </BrowserRouter>
    );

    // Posto je default stanje "privatni profil" - trazimo ime "neko_tajni"
    expect(screen.getByText(/neko_tajni/i)).toBeInTheDocument();
    
    // Provera da li se prikazuju reci objava, pratilaca, prati (STRIKTNA PRETRAGA DA SE ROBOT NE ZBUNI)
    expect(screen.getByText('objava')).toBeInTheDocument();
    expect(screen.getByText('pratilaca')).toBeInTheDocument();
    expect(screen.getByText('prati')).toBeInTheDocument();
  });

  test('menja stanje dugmeta kada se klikne na Blokiraj', () => {
    render(
      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Profile />
      </BrowserRouter>
    );

    const blockButton = screen.getByRole('button', { name: /Blokiraj/i });
    expect(blockButton).toBeInTheDocument();

    fireEvent.click(blockButton);

    // Provera da li se tekst promenio u Odblokiraj
    expect(screen.getByRole('button', { name: /Odblokiraj/i })).toBeInTheDocument();
  });

  test('otvara modal (iskačući prozor) kada se klikne na dugme "Moj Profil" da uredi podatke', () => {
    render(
      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Profile />
      </BrowserRouter>
    );

    const mojProfilButton = screen.getByRole('button', { name: /Moj Profil/i });
    fireEvent.click(mojProfilButton);

    const editButton = screen.getByRole('button', { name: /Uredi profil/i });
    fireEvent.click(editButton);

    // Provera da li je iskocio prozor gde pise Ime, Korisnicko ime, Biografija
    expect(screen.getByText('Ime')).toBeInTheDocument();
    expect(screen.getByText('Korisničko ime')).toBeInTheDocument();
    expect(screen.getByText('Biografija')).toBeInTheDocument();
  });

});