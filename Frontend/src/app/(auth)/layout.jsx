// /src/app/layout.jsx
import { Geist, Geist_Mono } from "next/font/google";
import Navigation from "../components/Navigation";
import Header from "../components/Header";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "Semai",
  description: "Wildlife Conservation Platform",
};

export default function PublicLayout({ children }) {
  return (
    <div>
        <Header />
        <div className="container">
          {children}
        </div>
        <Navigation />
    </div>

  );
}