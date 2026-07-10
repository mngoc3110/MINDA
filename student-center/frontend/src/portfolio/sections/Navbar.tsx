import { useState, useEffect } from "react";

import { links, navLinks } from "../constants";
import { cn } from "../lib/utils";

export const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isContactOpen, setIsContactOpen] = useState(false);

  useEffect(() => {
    const handleOpenContact = () => setIsContactOpen(true);
    window.addEventListener('open-contact', handleOpenContact);
    return () => window.removeEventListener('open-contact', handleOpenContact);
  }, []);

  const toggleMenu = () => setIsOpen((prevOpen) => !prevOpen);

  const NavItems = () => (
    <ul className="nav-ul">
      {navLinks.map(({ id, href, name }) => (
        <li key={id} className="nav-li">
          <a
            href={href}
            className="nav-li_a"
            onClick={(e) => {
              setIsOpen(false);
              if (name === "Contact") {
                e.preventDefault();
                setIsContactOpen(true);
              }
            }}
          >
            {name}
          </a>
        </li>
      ))}
    </ul>
  );

  return (
    <header className="fixed left-0 right-0 top-0 z-50 bg-[#faedeb]/90">
      <div className="mx-auto max-w-7xl">
        <div className="c-space mx-auto flex items-center justify-between py-5">
          <a
            href="#"
            className="text-xl font-bold text-gray-800 transition-colors hover:text-black"
          >
            Minh Ngọc
          </a>

          <button
            onClick={toggleMenu}
            className="flex text-gray-800 hover:text-black sm:hidden"
            aria-label="Toggle Menu"
          >
            <img
              src={isOpen ? "/assets/close.svg" : "/assets/menu.svg"}
              alt="Toggle"
              className="size-6"
            />
          </button>

          <nav className="hidden sm:flex">
            <NavItems />
          </nav>
        </div>
      </div>

      <div className={cn("nav-sidebar", isOpen ? "max-h-screen" : "max-h-0")}>
        <nav className="p-5">
          <NavItems />
        </nav>
      </div>

      {isContactOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white text-black p-8 rounded-xl shadow-2xl max-w-md w-full relative">
            <button
              onClick={() => setIsContactOpen(false)}
              className="absolute top-4 right-4 text-gray-500 hover:text-black font-bold text-xl"
            >
              ✕
            </button>
            <h2 className="text-2xl font-bold mb-6 text-center">Liên hệ</h2>
            <div className="space-y-4">
              <p><strong>Tên:</strong> Minh Ngọc</p>
              <p><strong>SĐT:</strong> 0902937006</p>
              <p><strong>Email:</strong> darber3110@gmail.com</p>
              <p><strong>Website:</strong> <a href="https://minda.io.vn" className="text-blue-500 hover:underline">minda.io.vn</a></p>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
