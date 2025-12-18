"use client";
import { Login } from '../components/login';
import { Providers } from './providers';

export default function Home() {
  return (
    <Providers>
      <Login />
    </Providers>
  );
}
